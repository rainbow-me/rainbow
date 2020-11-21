import { Contract } from '@ethersproject/contracts';
import { ChainId, WETH } from '@uniswap/sdk';
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import contractMap from 'eth-contract-metadata';
import { compact, get, keyBy, map, partition, toLower } from 'lodash';
import { SwapCurrency } from '../handlers/uniswap';
import {
  convertAmountToRawAmount,
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { parseAssetsNative } from '../parsers/accounts';
import { erc20ABI } from '../references';
import { UNISWAP_V1_EXCHANGE_ABI } from '../references/uniswap';
import { web3Provider } from './web3';
import { Asset, ParsedAddressAsset } from '@rainbow-me/entities';
import logger from 'logger';

interface UnderlyingToken extends Asset {
  balance: string;
}

export interface LiquidityInfo extends ParsedAddressAsset {
  tokens: UnderlyingToken[];
  totalSupply: string;
}

const getTokenDetails = async (
  chainId: ChainId,
  tokenAddress: string,
  pairs: Record<string, SwapCurrency>
): Promise<Asset> => {
  if (toLower(tokenAddress) === toLower(WETH[chainId].address)) {
    return {
      address: 'eth',
      decimals: 18,
      name: 'Ethereum',
      symbol: 'ETH',
    };
  }

  const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);

  const token = get(pairs, `[${toLower(tokenAddress)}]`);

  let decimals: number;
  let name = '';
  let symbol = '';

  if (token) {
    name = token.name;
    symbol = token.symbol;
    decimals = Number(token.decimals);
  } else {
    decimals = get(contractMap, `[${tokenAddress}].decimals`);
    if (!decimals) {
      try {
        decimals = await tokenContract.decimals().catch();
      } catch (error) {
        decimals = 18;
        logger.log(
          'error getting decimals for token: ',
          tokenAddress,
          ' Error = ',
          error
        );
      }
    }

    name = get(contractMap, `[${tokenAddress}].name`, '');
    if (!name) {
      try {
        name = await tokenContract.name().catch();
      } catch (error) {
        logger.log(
          'error getting name for token: ',
          tokenAddress,
          ' Error = ',
          error
        );
      }
    }

    symbol = get(contractMap, `[${tokenAddress}].symbol`, '');
    if (!symbol) {
      try {
        symbol = await tokenContract.symbol().catch();
      } catch (error) {
        logger.log(
          'error getting symbol for token: ',
          tokenAddress,
          ' Error = ',
          error
        );
      }
    }
  }
  return {
    address: tokenAddress,
    decimals,
    name,
    symbol,
  };
};

export const getLiquidityInfo = async (
  chainId: ChainId,
  accountAddress: string,
  nativeCurrency: string,
  liquidityPoolTokens: ParsedAddressAsset[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo>> => {
  const liquidityPoolTokensWithNative = parseAssetsNative(
    liquidityPoolTokens,
    nativeCurrency
  );
  const [v1Tokens, v2Tokens] = partition(
    liquidityPoolTokensWithNative,
    token => token.type === 'uniswap'
  );
  const v1TokensCall = getLiquidityInfoV1(
    chainId,
    accountAddress,
    v1Tokens,
    pairs
  );
  const v2TokensCall = getLiquidityInfoV2(
    chainId,
    accountAddress,
    v2Tokens,
    pairs
  );
  const [v1Results, v2Results] = await Promise.all([
    v1TokensCall,
    v2TokensCall,
  ]);
  return { ...v1Results, ...v2Results };
};

const getLiquidityInfoV2 = async (
  chainId: ChainId,
  accountAddress: string,
  liquidityTokens: ParsedAddressAsset[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo>> => {
  const promises = map(liquidityTokens, async lpToken => {
    try {
      const liquidityPoolAddress = lpToken.address;
      const pair = new Contract(
        liquidityPoolAddress,
        IUniswapV2PairABI,
        web3Provider
      );

      const token0AddressCall = pair.token0();
      const token1AddressCall = pair.token1();
      const pairReservesCall = pair.getReserves();
      const totalSupplyCall = pair.totalSupply();

      const [
        token0AddressResult,
        token1AddressResult,
        pairReservesResult,
        totalSupplyResult,
      ] = await Promise.all([
        token0AddressCall,
        token1AddressCall,
        pairReservesCall,
        totalSupplyCall,
      ]);

      const token0Address = token0AddressResult.toString();
      const token1Address = token1AddressResult.toString();

      const lpTokenBalance = convertAmountToRawAmount(
        lpToken?.balance?.amount || 0,
        lpToken?.decimals
      );

      const [token0ReserveBn, token1ReserveBn] = pairReservesResult;
      const token0Reserve = token0ReserveBn.toString();
      const token1Reserve = token1ReserveBn.toString();
      const totalSupply = totalSupplyResult.toString();

      const token0 = await getTokenDetails(chainId, token0Address, pairs);
      const token1 = await getTokenDetails(chainId, token1Address, pairs);

      const token0Balance = convertRawAmountToDecimalFormat(
        divide(multiply(token0Reserve, lpTokenBalance), totalSupply),
        token0.decimals
      );

      const token1Balance = convertRawAmountToDecimalFormat(
        divide(multiply(token1Reserve, lpTokenBalance), totalSupply),
        token1.decimals
      );

      return {
        ...lpToken,
        tokens: [
          {
            balance: token0Balance,
            ...token0,
          },
          {
            balance: token1Balance,
            ...token1,
          },
        ],
        totalSupply: convertRawAmountToDecimalFormat(totalSupply),
      };
    } catch (error) {
      logger.log('error getting uniswap info', error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  const updatedResults = compact(results);
  return keyBy(updatedResults, result => result.address);
};

const getLiquidityInfoV1 = async (
  chainId: ChainId,
  accountAddress: string,
  liquidityTokens: ParsedAddressAsset[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo>> => {
  const promises = map(liquidityTokens, async lpToken => {
    try {
      const liquidityPoolAddress = lpToken.address;
      const ethReserveCall = web3Provider.getBalance(liquidityPoolAddress);
      const lpTokenBalance = convertAmountToRawAmount(
        lpToken?.balance?.amount || 0,
        lpToken?.decimals
      );

      const exchange = new Contract(
        liquidityPoolAddress,
        UNISWAP_V1_EXCHANGE_ABI,
        web3Provider
      );
      const tokenAddressCall = exchange.tokenAddress();
      const totalSupplyCall = exchange.totalSupply();

      const [
        ethReserveResult,
        tokenAddress,
        totalSupplyResult,
      ] = await Promise.all([
        ethReserveCall,
        tokenAddressCall,
        totalSupplyCall,
      ]);

      const ethReserve = ethReserveResult.toString();
      const totalSupply = totalSupplyResult.toString();

      const tokenContract = new Contract(tokenAddress, erc20ABI, web3Provider);

      const token = await getTokenDetails(chainId, tokenAddress, pairs);

      const reserveResult = await tokenContract.balanceOf(liquidityPoolAddress);
      const reserve = reserveResult.toString();

      const ethBalance = fromWei(
        divide(multiply(ethReserve, lpTokenBalance), totalSupply)
      );
      const tokenBalance = convertRawAmountToDecimalFormat(
        divide(multiply(reserve, lpTokenBalance), totalSupply),
        token.decimals
      );

      return {
        ...lpToken,
        tokens: [
          {
            balance: tokenBalance,
            ...token,
          },
          {
            address: 'eth',
            balance: ethBalance,
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH',
          },
        ],
        totalSupply: convertRawAmountToDecimalFormat(totalSupply),
      };
    } catch (error) {
      logger.log('error getting uniswap info', error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  const updatedResults = compact(results);
  return keyBy(updatedResults, result => result.address);
};
