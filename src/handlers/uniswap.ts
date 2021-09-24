import { BigNumberish } from '@ethersproject/bignumber';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import { ChainId, Token, WETH } from '@uniswap/sdk';
import { get, mapKeys, mapValues, toLower } from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS } from '../apollo/queries';
import { loadWallet } from '../model/wallet';
import { estimateGasWithPadding, getProviderForNetwork } from './web3';
import { Asset } from '@rainbow-me/entities';
import { add, divide, multiply, subtract } from '@rainbow-me/helpers/utilities';
import { Network } from '@rainbow-me/networkTypes';
import store from '@rainbow-me/redux/store';
import {
  uniswapLoadedAllTokens,
  uniswapUpdateTokens,
} from '@rainbow-me/redux/uniswap';
import { ethUnits, UNISWAP_TESTNET_TOKEN_LIST } from '@rainbow-me/references';
import { ethereumUtils } from '@rainbow-me/utils';
import logger from 'logger';
import { fillQuote, getQuoteExecutionDetails, Quote } from 'rainbow-swaps';

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
  if (!provider || !tradeDetails || requiresApprove) {
    return ethUnits.basic_swap;
  }
  try {
    const { params, method, methodArgs } = getQuoteExecutionDetails(
      tradeDetails,
      { from: tradeDetails.from },
      provider
    );

    const gasLimit = await estimateGasWithPadding(
      params,
      method,
      methodArgs,
      provider
    );
    return gasLimit;
  } catch (error) {
    logger.sentry('error executing estimateSwapGasLimit');
    captureException(error);
    return ethUnits.basic_swap;
  }
};

export const computeSlippageAdjustedAmounts = (
  trade: any,
  allowedSlippageInBlips: string
): { [field in Field]: BigNumberish } => {
  logger.debug('computeSlippageAdjustedAmounts ::  trade?', trade);
  let input = trade?.sellAmount;
  let output = trade?.buyAmount;
  if (trade?.tradeType === 'exact_input' && trade?.buyAmount) {
    logger.debug('exact_input');
    const product = multiply(trade.buyAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');
    output = subtract(output, result);
  } else if (trade?.tradeType === 'exact_output' && trade?.sellAmount) {
    const product = multiply(trade.sellAmount, allowedSlippageInBlips);
    const result = divide(product, '10000');
    input = add(input, result);
    logger.debug('exact_output');
  }

  const results = {
    [Field.INPUT]: input,
    [Field.OUTPUT]: output,
  };
  logger.debug({ input, output });
  return results;
};

export const executeSwap = async ({
  chainId,
  gasLimit,
  gasPrice,
  nonce,
  tradeDetails,
  wallet,
}: {
  chainId: ChainId;
  gasLimit: string | number;
  gasPrice: string;
  nonce?: number;
  tradeDetails: Quote | null;
  wallet: Wallet | null;
}) => {
  let walletToUse = wallet;
  if (!walletToUse) {
    const network = ethereumUtils.getNetworkFromChainId(chainId);
    const provider = await getProviderForNetwork(network);
    walletToUse = await loadWallet(provider);
  }
  if (!walletToUse || !tradeDetails) return null;
  return fillQuote(tradeDetails, { gasLimit, gasPrice, nonce }, walletToUse);
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
  if (currency.address === 'eth') return WETH[chainId];
  return new Token(
    chainId,
    currency.address,
    currency.decimals,
    currency.symbol,
    currency.name
  );
};
