import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber } from '@ethersproject/bignumber';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import {
  ChainId,
  CurrencyAmount,
  Pair,
  Percent,
  Token,
  TokenAmount,
  Trade,
  TradeType,
  WETH,
} from '@uniswap/sdk';
import { get, isEmpty, mapKeys, mapValues, toLower } from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS } from '../apollo/queries';
import { Network } from '../helpers/networkTypes';
import {
  addBuffer,
  convertAmountToRawAmount,
  convertNumberToString,
} from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import { ethUnits, tokenOverrides } from '../references';
import {
  UNISWAP_TESTNET_TOKEN_LIST,
  UNISWAP_V2_ROUTER_ABI,
  UNISWAP_V2_ROUTER_ADDRESS,
} from '../references/uniswap';

import { toHex, web3Provider } from './web3';
import logger from 'logger';

enum Field {
  INPUT = 'INPUT',
  OUTPUT = 'OUTPUT',
}

enum SwapType {
  EXACT_TOKENS_FOR_TOKENS,
  EXACT_TOKENS_FOR_ETH,
  EXACT_ETH_FOR_TOKENS,
  TOKENS_FOR_EXACT_TOKENS,
  TOKENS_FOR_EXACT_ETH,
  ETH_FOR_EXACT_TOKENS,
}

export interface SwapCurrency {
  address: string;
  decimals: number;
  name: string;
  symbol: string;
}

export interface TokenInfo extends SwapCurrency {
  derivedETH: string;
  totalLiquidity: string;
}

export interface UniswapSubgraphToken extends TokenInfo {
  id: string;
}

export interface AllTokenInfo {
  [tokenAddress: string]: TokenInfo;
}

const UniswapPageSize = 1000;

const DefaultMaxSlippageInBips = 200;
const SlippageBufferInBips = 100;

// default allowed slippage, in bips
const INITIAL_ALLOWED_SLIPPAGE = 50;
// 20 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 20;

export const getTestnetUniswapPairs = (
  network: Network
): { [key: string]: SwapCurrency } => {
  const pairs: { [address: string]: SwapCurrency } = get(
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
  accountAddress,
  chainId,
  tradeDetails,
}: {
  accountAddress: string;
  chainId: ChainId;
  tradeDetails: Trade | null;
}): Promise<{
  gasLimit: string | number;
  methodName?: string | null;
}> => {
  let methodName = null;
  if (!tradeDetails) {
    return {
      gasLimit: ethUnits.basic_swap,
    };
  }
  try {
    const {
      exchange,
      methodNames,
      updatedMethodArgs,
      value,
    } = getContractExecutionDetails({
      accountAddress,
      chainId,
      providerOrSigner: web3Provider,
      tradeDetails,
    });

    const params = { from: accountAddress, ...(value ? { value } : {}) };
    const gasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map((methodName: string) =>
        exchange.estimateGas[methodName](...updatedMethodArgs, params)
          .then((value: BigNumber) => value)
          .catch((_: Error) => {
            return undefined;
          })
      )
    );

    // we expect failures from left to right, so throw if we see failures
    // from right to left
    for (let i = 0; i < gasEstimates.length - 1; i++) {
      // if the FoT method fails, but the regular method does not, we should not
      // use the regular method. this probably means something is wrong with the fot token.
      if (gasEstimates[i] && !gasEstimates[i + 1]) {
        return { gasLimit: ethUnits.basic_swap, methodName: null };
      }
    }

    const indexOfSuccessfulEstimation = gasEstimates.findIndex(
      gasEstimate => !!gasEstimate
    );

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      return { gasLimit: ethUnits.basic_swap, methodName: null };
    } else {
      methodName = methodNames[indexOfSuccessfulEstimation];
      const gasEstimate = gasEstimates[indexOfSuccessfulEstimation];
      let gasLimit: string | number = ethUnits.basic_swap;
      if (gasEstimate) {
        gasLimit = addBuffer(gasEstimate.toString());
      }
      return { gasLimit, methodName };
    }
  } catch (error) {
    logger.sentry('error executing estimateSwapGasLimit');
    captureException(error);
    return {
      gasLimit: ethUnits.basic_swap,
    };
  }
};

const getSwapType = (
  tokens: { [field in Field]: Token },
  chainId: ChainId,
  isExactIn: boolean
): SwapType => {
  const WETH_FOR_CHAIN_ID = WETH[chainId];
  if (isExactIn) {
    if (tokens[Field.INPUT].equals(WETH_FOR_CHAIN_ID)) {
      return SwapType.EXACT_ETH_FOR_TOKENS;
    } else if (tokens[Field.OUTPUT].equals(WETH_FOR_CHAIN_ID)) {
      return SwapType.EXACT_TOKENS_FOR_ETH;
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS;
    }
  } else {
    if (tokens[Field.INPUT].equals(WETH_FOR_CHAIN_ID)) {
      return SwapType.ETH_FOR_EXACT_TOKENS;
    } else if (tokens[Field.OUTPUT].equals(WETH_FOR_CHAIN_ID)) {
      return SwapType.TOKENS_FOR_EXACT_ETH;
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS;
    }
  }
};

const computeSlippageAdjustedAmounts = (
  trade: Trade,
  allowedSlippage: string
): { [field in Field]: CurrencyAmount } => {
  const pct = new Percent(allowedSlippage, '10000');
  const results = {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  };
  return results;
};

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
const getExecutionDetails = (
  accountAddress: string,
  chainId: ChainId,
  trade: Trade,
  providerOrSigner: Provider | Signer,
  allowedSlippage: number = INITIAL_ALLOWED_SLIPPAGE, // in bips, optional
  deadline: number = DEFAULT_DEADLINE_FROM_NOW // in seconds from now, optional
): {
  methodArguments: (string | string[] | number)[];
  methodNames: string[];
  value: string | null;
} => {
  const recipient = accountAddress;

  const {
    [Field.INPUT]: slippageAdjustedInput,
    [Field.OUTPUT]: slippageAdjustedOutput,
  } = computeSlippageAdjustedAmounts(trade, allowedSlippage.toString());

  const path = trade.route.path.map(t => t.address);

  const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline;

  const swapType = getSwapType(
    {
      [Field.INPUT]: trade.inputAmount.currency as Token,
      [Field.OUTPUT]: trade.outputAmount.currency as Token,
    },
    chainId,
    trade.tradeType === TradeType.EXACT_INPUT
  );

  // let estimate: Function, method: Function,
  let methodNames: string[],
    args: (string | string[] | number)[],
    value: string | null = null;
  switch (swapType) {
    case SwapType.EXACT_TOKENS_FOR_TOKENS:
      methodNames = [
        'swapExactTokensForTokens',
        'swapExactTokensForTokensSupportingFeeOnTransferTokens',
      ];
      args = [
        slippageAdjustedInput.raw.toString(),
        slippageAdjustedOutput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      break;
    case SwapType.TOKENS_FOR_EXACT_TOKENS:
      methodNames = ['swapTokensForExactTokens'];
      args = [
        slippageAdjustedOutput.raw.toString(),
        slippageAdjustedInput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      break;
    case SwapType.EXACT_ETH_FOR_TOKENS:
      methodNames = [
        'swapExactETHForTokens',
        'swapExactETHForTokensSupportingFeeOnTransferTokens',
      ];
      args = [
        slippageAdjustedOutput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      value = slippageAdjustedInput.raw.toString();
      break;
    case SwapType.TOKENS_FOR_EXACT_ETH:
      methodNames = ['swapTokensForExactETH'];
      args = [
        slippageAdjustedOutput.raw.toString(),
        slippageAdjustedInput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      break;
    case SwapType.EXACT_TOKENS_FOR_ETH:
      methodNames = [
        'swapExactTokensForETH',
        'swapExactTokensForETHSupportingFeeOnTransferTokens',
      ];
      args = [
        slippageAdjustedInput.raw.toString(),
        slippageAdjustedOutput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      break;
    case SwapType.ETH_FOR_EXACT_TOKENS:
      methodNames = ['swapETHForExactTokens'];
      args = [
        slippageAdjustedOutput.raw.toString(),
        path,
        recipient,
        deadlineFromNow,
      ];
      value = slippageAdjustedInput.raw.toString();
      break;
  }
  return {
    methodArguments: args,
    methodNames,
    value,
  };
};

const getContractExecutionDetails = ({
  accountAddress,
  chainId,
  providerOrSigner,
  tradeDetails,
}: {
  accountAddress: string;
  chainId: ChainId;
  providerOrSigner: Provider | Signer;
  tradeDetails: Trade;
}) => {
  const priceImpact = tradeDetails?.priceImpact?.toFixed(2).toString();
  const slippage = Number(priceImpact) * 100;
  const maxSlippage = Math.max(
    slippage + SlippageBufferInBips,
    DefaultMaxSlippageInBips
  );
  const { methodArguments, methodNames, value } = getExecutionDetails(
    accountAddress,
    chainId,
    tradeDetails,
    providerOrSigner,
    maxSlippage
  );

  const exchange = new Contract(
    UNISWAP_V2_ROUTER_ADDRESS,
    UNISWAP_V2_ROUTER_ABI,
    providerOrSigner
  );

  return {
    exchange,
    methodNames,
    updatedMethodArgs: methodArguments,
    value,
  };
};

export const executeSwap = async ({
  accountAddress,
  chainId,
  gasLimit,
  gasPrice,
  methodName,
  tradeDetails,
  wallet,
}: {
  accountAddress: string;
  chainId: ChainId;
  gasLimit: string | number;
  gasPrice: string;
  methodName: string;
  tradeDetails: Trade | null;
  wallet: Wallet | null;
}) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse || !tradeDetails) return null;
  const { exchange, updatedMethodArgs, value } = getContractExecutionDetails({
    accountAddress,
    chainId,
    providerOrSigner: walletToUse,
    tradeDetails,
  });

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    gasPrice: toHex(gasPrice) || undefined,
    ...(value ? { value } : {}),
  };
  return exchange[methodName](...updatedMethodArgs, transactionParams);
};

export const getAllTokens = async (excluded = []): Promise<AllTokenInfo> => {
  let allTokens: AllTokenInfo = {};
  let data: UniswapSubgraphToken[] = [];
  try {
    let dataEnd = false;
    let skip = 0;
    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_TOKENS,
        variables: {
          excluded,
          first: UniswapPageSize,
          skip: skip,
        },
      });
      data = data.concat(result.data.tokens);
      skip = skip + UniswapPageSize;
      if (result.data.tokens.length < UniswapPageSize) {
        dataEnd = true;
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }
  data.forEach(token => {
    const tokenAddress = toLower(token.id);
    const tokenInfo = {
      address: token.id,
      decimals: Number(token.decimals),
      derivedETH: token.derivedETH,
      name: token.name,
      symbol: token.symbol,
      totalLiquidity: token.totalLiquidity,
      ...tokenOverrides[tokenAddress],
    };
    allTokens[tokenAddress] = tokenInfo;
  });
  return allTokens;
};

export const calculateTradeDetails = (
  chainId: ChainId,
  inputAmount: string | null,
  outputAmount: string | null,
  inputCurrency: SwapCurrency,
  outputCurrency: SwapCurrency,
  pairs: Pair[],
  exactInput: boolean
): Trade | null => {
  if (!inputCurrency || !outputCurrency || isEmpty(pairs)) {
    return null;
  }

  const inputToken = getTokenForCurrency(inputCurrency, chainId);
  const outputToken = getTokenForCurrency(outputCurrency, chainId);
  if (exactInput) {
    const inputRawAmount = convertAmountToRawAmount(
      convertNumberToString(inputAmount || 0),
      inputToken.decimals
    );

    const amountIn = new TokenAmount(inputToken, inputRawAmount);
    return Trade.bestTradeExactIn(pairs, amountIn, outputToken, {
      maxNumResults: 1,
    })[0];
  } else {
    const outputRawAmount = convertAmountToRawAmount(
      convertNumberToString(outputAmount || 0),
      outputToken.decimals
    );
    const amountOut = new TokenAmount(outputToken, outputRawAmount);
    return Trade.bestTradeExactOut(pairs, inputToken, amountOut, {
      maxNumResults: 1,
    })[0];
  }
};

export const getTokenForCurrency = (
  currency: SwapCurrency,
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
