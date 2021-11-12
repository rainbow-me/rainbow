import { BigNumberish } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { get, mapKeys, mapValues, toLower } from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS } from '../apollo/queries';
import { Token } from '../entities/tokens';
import { loadWallet } from '../model/wallet';
import {
  estimateGasWithPadding,
  getFlashbotsProvider,
  getProviderForNetwork,
} from './web3';
import { Asset } from '@rainbow-me/entities';
import {
  add,
  convertRawAmountToDecimalFormat,
  divide,
  multiply,
  subtract,
} from '@rainbow-me/helpers/utilities';
import { Network } from '@rainbow-me/networkTypes';
import store from '@rainbow-me/redux/store';
import {
  uniswapLoadedAllTokens,
  uniswapUpdateTokens,
} from '@rainbow-me/redux/uniswap';
import { ethUnits, UNISWAP_TESTNET_TOKEN_LIST } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';
import {
  ALLOWS_PERMIT,
  ChainId,
  ETH_ADDRESS as ETH_ADDRESS_AGGREGATORS,
  fillQuote,
  getQuoteExecutionDetails,
  geWethMethod,
  PermitSupportedTokenList,
  Quote,
  unwrapWeth,
  WETH,
  wrapEth,
} from 'rainbow-swaps';

export enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

const UniswapPageSize = 1000;

export const getTestnetUniswapPairs = (
  network: Network
): { [key: string]: Asset } => {
  const pairs: { [address: string]: Asset } = get(
    UNISWAP_TESTNET_TOKEN_LIST,
    network,
    {}
  );
  const loweredPairs = mapKeys(pairs, (_, key) => toLower(key));
  return mapValues(loweredPairs, value => ({
    ...value,
    address: toLower(value.address),
  }));
};

const getBasicSwapGasLimitForTrade = (tradeDetails: Quote): number => {
  const allowsPermit =
    ALLOWS_PERMIT[
      toLower(tradeDetails.sellTokenAddress) as keyof PermitSupportedTokenList
    ];

  if (allowsPermit) {
    return ethUnits.basic_swap_permit;
  } else {
    return ethUnits.basic_swap;
  }
};

export const estimateSwapGasLimit = async ({
  chainId,
  requiresApprove,
  tradeDetails,
}: {
  chainId: ChainId;
  requiresApprove?: boolean;
  tradeDetails: Quote | null;
}): Promise<string | number> => {
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  const provider = await getProviderForNetwork(network);
  if (!provider || !tradeDetails) {
    return ethUnits.basic_swap;
  }

  if (requiresApprove) {
    return getBasicSwapGasLimitForTrade(tradeDetails);
  }

  const { sellTokenAddress, buyTokenAddress } = tradeDetails;

  const isWrapEth =
    sellTokenAddress === ETH_ADDRESS_AGGREGATORS &&
    buyTokenAddress === WETH[ChainId.mainnet];
  const isUnwrapWeth =
    sellTokenAddress === WETH[ChainId.mainnet] &&
    buyTokenAddress === ETH_ADDRESS_AGGREGATORS;

  // Wrap / Unwrap Eth
  if (isWrapEth || isUnwrapWeth) {
    const default_estimate = isWrapEth
      ? ethUnits.weth_wrap
      : ethUnits.weth_unwrap;
    try {
      const gasLimit = await estimateGasWithPadding(
        {
          from: tradeDetails.from,
          value: isWrapEth ? tradeDetails.buyAmount : '0',
        },
        geWethMethod(isWrapEth ? 'deposit' : 'withdraw', provider),
        // @ts-ignore
        isUnwrapWeth ? [tradeDetails.buyAmount] : null,
        provider,
        1.002
      );

      return gasLimit || default_estimate;
    } catch (e) {
      return default_estimate;
    }
    // Swap
  } else {
    try {
      const { params, method, methodArgs } = getQuoteExecutionDetails(
        tradeDetails,
        { from: tradeDetails.from },
        provider
      );

      const gasLimit = await estimateGasWithPadding(
        params,
        method,
        methodArgs as any,
        provider,
        1.01
      );
      return gasLimit || getBasicSwapGasLimitForTrade(tradeDetails);
    } catch (error) {
      return getBasicSwapGasLimitForTrade(tradeDetails);
    }
  }
};

export const computeSlippageAdjustedAmounts = (
  trade: any,
  allowedSlippageInBlips: string
): { [field in Field]: BigNumberish } => {
  let input = trade?.sellAmount;
  let output = trade?.buyAmount;
  if (trade?.tradeType === 'exact_input' && trade?.buyAmount) {
    const product = multiply(trade.buyAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');
    output = convertRawAmountToDecimalFormat(
      subtract(output, result),
      trade.outputTokenDecimals
    );
  } else if (trade?.tradeType === 'exact_output' && trade?.sellAmount) {
    const product = multiply(trade.sellAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');

    input = convertRawAmountToDecimalFormat(
      add(input, result),
      trade.outputTokenDecimals
    );
  }

  const results = {
    [Field.INPUT]: input,
    [Field.OUTPUT]: output,
  };
  return results;
};

export const executeSwap = async ({
  chainId,
  gasLimit,
  gasPrice,
  nonce,
  tradeDetails,
  wallet,
  permit = false,
}: {
  chainId: ChainId;
  gasLimit: string | number;
  gasPrice: string;
  nonce?: number;
  tradeDetails: Quote | null;
  wallet: Wallet | null;
  permit: boolean;
}) => {
  const useFlashbots = false;
  let walletToUse = wallet;
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  // Switch to the flashbots provider!
  let provider = await getProviderForNetwork(network);
  if (useFlashbots) {
    provider = await getFlashbotsProvider();
  }

  if (!walletToUse) {
    walletToUse = await loadWallet(undefined, true, provider);
  } else {
    walletToUse = new Wallet(walletToUse.privateKey, provider);
  }

  if (!walletToUse || !tradeDetails) return null;

  const { sellTokenAddress, buyTokenAddress } = tradeDetails;

  // Wrap Eth
  if (
    sellTokenAddress === ETH_ADDRESS_AGGREGATORS &&
    buyTokenAddress === WETH[ChainId.mainnet]
  ) {
    return wrapEth(tradeDetails.buyAmount, walletToUse);
    // Unwrap Weth
  } else if (
    sellTokenAddress === WETH[ChainId.mainnet] &&
    buyTokenAddress === ETH_ADDRESS_AGGREGATORS
  ) {
    return unwrapWeth(tradeDetails.sellAmount, walletToUse);
    // Swap
  } else {
    return fillQuote(
      tradeDetails,
      { gasLimit, gasPrice, nonce },
      walletToUse,
      permit,
      chainId
    );
  }
};

export const getAllTokens = async () => {
  const { dispatch } = store;
  try {
    let dataEnd = false;
    let lastId = '';

    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_TOKENS,
        variables: {
          first: UniswapPageSize,
          lastId,
        },
      });
      const resultTokens = result?.data?.tokens || [];
      const lastItem = resultTokens[resultTokens.length - 1];
      lastId = lastItem?.id ?? '';
      dispatch(uniswapUpdateTokens(resultTokens));
      if (resultTokens.length < UniswapPageSize) {
        dispatch(uniswapLoadedAllTokens());
        dataEnd = true;
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }
};

export const getTokenForCurrency = (
  currency: Asset,
  chainId: ChainId
): Token => {
  return { ...currency, chainId } as Token;
};
