import { Contract } from '@ethersproject/contracts';
import { ChainId, WETH } from '@uniswap/sdk';
import { abi as IUniswapV2PairABI } from '@uniswap/v2-core/build/IUniswapV2Pair.json';
import contractMap from 'eth-contract-metadata';
import { get, keyBy, map, partition, toLower } from 'lodash';
import { SwapCurrency } from '../handlers/uniswap';
import {
  convertRawAmountToDecimalFormat,
  divide,
  fromWei,
  multiply,
} from '../helpers/utilities';
import { erc20ABI } from '../references';
import { UNISWAP_V1_EXCHANGE_ABI } from '../references/uniswap';
import { web3Provider } from './web3';
import logger from 'logger';

interface LiquidityToken {
  address: string;
  balance: string;
  name: string;
  symbol: string;
}

interface TokenDetails {
  decimals: number;
  name: string;
  symbol: string;
}

export interface LiquidityInfo {
  address: string;
  balance: string;
  price?: {
    changed_at?: number;
    value?: number;
    relative_change_24h?: number;
  };
  tokens: LiquidityToken[];
  totalSupply: string;
  uniqueId: string;
}

export interface LPToken {
  asset: {
    asset_code: string;
    price?: {
      changed_at?: number;
      value?: number;
      relative_change_24h?: number;
    };
    type: string;
  };
  quantity: string;
}

const getAssetCode = (token: LPToken): string => get(token, 'asset.asset_code');

const getTokenDetails = async (
  chainId: ChainId,
  tokenAddress: string,
  pairs: Record<string, SwapCurrency>
): Promise<TokenDetails> => {
  if (toLower(tokenAddress) === toLower(WETH[chainId].address)) {
    return {
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
    decimals,
    name,
    symbol,
  };
};

export const getLiquidityInfo = async (
  chainId: ChainId,
  accountAddress: string,
  liquidityPoolTokens: LPToken[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo | {}>> => {
  const [v1Tokens, v2Tokens] = partition(
    liquidityPoolTokens,
    token => token?.asset?.type === 'uniswap'
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
  liquidityTokens: LPToken[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo | {}>> => {
  const promises = map(liquidityTokens, async lpToken => {
    try {
      const liquidityPoolAddress = getAssetCode(lpToken);
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

      const lpTokenBalance = lpToken.quantity;

      const [token0ReserveBn, token1ReserveBn] = pairReservesResult;
      const token0Reserve = token0ReserveBn.toString();
      const token1Reserve = token1ReserveBn.toString();
      const totalSupply = totalSupplyResult.toString();

      const token0 = await getTokenDetails(chainId, token0Address, pairs);
      const token1 = await getTokenDetails(chainId, token1Address, pairs);

      const token0Balance = convertRawAmountToDecimalFormat(
        divide(multiply(token0Reserve, lpTokenBalance), totalSupply),
        Number(token0.decimals)
      );

      const token1Balance = convertRawAmountToDecimalFormat(
        divide(multiply(token1Reserve, lpTokenBalance), totalSupply),
        Number(token1.decimals)
      );

      return {
        address: liquidityPoolAddress,
        balance: convertRawAmountToDecimalFormat(lpTokenBalance),
        price: lpToken?.asset?.price,
        tokens: [
          {
            address: token0Address,
            balance: token0Balance,
            ...token0,
          },
          {
            address: token1Address,
            balance: token1Balance,
            ...token1,
          },
        ],
        totalSupply: convertRawAmountToDecimalFormat(totalSupply),
        type: lpToken?.asset?.type,
        uniqueId: `uniswap_${liquidityPoolAddress}`,
      };
    } catch (error) {
      logger.log('error getting uniswap info', error);
      return {};
    }
  });

  const results = await Promise.all(promises);
  return keyBy(results, result => result.address);
};

const getLiquidityInfoV1 = async (
  chainId: ChainId,
  accountAddress: string,
  liquidityTokens: LPToken[],
  pairs: Record<string, SwapCurrency>
): Promise<Record<string, LiquidityInfo | {}>> => {
  const promises = map(liquidityTokens, async lpToken => {
    try {
      const liquidityPoolAddress = getAssetCode(lpToken);
      const ethReserveCall = web3Provider.getBalance(liquidityPoolAddress);
      const lpTokenBalance = lpToken.quantity;
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

      const { decimals, name, symbol } = await getTokenDetails(
        chainId,
        tokenAddress,
        pairs
      );

      const reserveResult = await tokenContract.balanceOf(liquidityPoolAddress);
      const reserve = reserveResult.toString();

      const ethBalance = fromWei(
        divide(multiply(ethReserve, lpTokenBalance), totalSupply)
      );
      const tokenBalance = convertRawAmountToDecimalFormat(
        divide(multiply(reserve, lpTokenBalance), totalSupply),
        Number(decimals)
      );

      return {
        address: liquidityPoolAddress,
        balance: convertRawAmountToDecimalFormat(lpTokenBalance),
        price: lpToken?.asset?.price,
        tokens: [
          {
            address: tokenAddress,
            balance: tokenBalance,
            name,
            symbol,
          },
          {
            address: 'eth',
            balance: ethBalance,
            name: 'Ethereum',
            symbol: 'ETH',
          },
        ],
        totalSupply: convertRawAmountToDecimalFormat(totalSupply),
        type: lpToken?.asset?.type,
        uniqueId: `uniswap_${liquidityPoolAddress}`,
      };
    } catch (error) {
      logger.log('error getting uniswap info', error);
      return {};
    }
  });

  const results = await Promise.all(promises);
  return keyBy(results, result => result.address);
};
