import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import {
  ChainId,
  Pair,
  Percent,
  Token,
  TokenAmount,
  Trade,
  TradeType,
  WETH,
} from '@uniswap/sdk';
import { getUnixTime, sub } from 'date-fns';
import { findKey, get, mapKeys, mapValues, toLower } from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS, UNISWAP_CHART_QUERY } from '../apollo/queries';
import ChartTypes from '../helpers/chartTypes';
import {
  convertAmountToRawAmount,
  convertNumberToString,
} from '../helpers/utilities';
import { loadWallet } from '../model/wallet';
import { ethUnits, uniswapTestnetAssets } from '../references';
import {
  UNISWAP_V2_ROUTER_ADDRESS,
  uniswapV2RouterABI,
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

const DefaultMaxSlippageInBips = 200;
const SlippageBufferInBips = 100;

// default allowed slippage, in bips
const INITIAL_ALLOWED_SLIPPAGE = 50;
// 20 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 20;

export const getTestnetUniswapPairs = network => {
  const pairs = get(uniswapTestnetAssets, network, {});
  const loweredPairs = mapKeys(pairs, (_, key) => toLower(key));
  return mapValues(loweredPairs, value => ({
    ...value,
  }));
};

export const estimateSwapGasLimit = async ({
  accountAddress,
  chainId,
  tradeDetails,
}) => {
  let methodName = null;
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
    const gasEstimates = await Promise.all(
      methodNames.map(methodName =>
        exchange.estimate[methodName](...updatedMethodArgs, params)
          .then(value => value)
          .catch(_ => {
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
      const gasLimit = gasEstimate?.toString() || ethUnits.basic_swap;
      return { gasLimit, methodName };
    }
  } catch (error) {
    logger.sentry('error executing estimateSwapGasLimit');
    captureException(error);
    return ethUnits.basic_swap;
  }
};

const getSwapType = (
  tokens: { [field in Field]?: Token },
  isExactIn: boolean,
  chainId: number
): SwapType => {
  if (isExactIn) {
    if (tokens[Field.INPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.EXACT_ETH_FOR_TOKENS;
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.EXACT_TOKENS_FOR_ETH;
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS;
    }
  } else {
    if (tokens[Field.INPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.ETH_FOR_EXACT_TOKENS;
    } else if (tokens[Field.OUTPUT]?.equals(WETH[chainId as ChainId])) {
      return SwapType.TOKENS_FOR_EXACT_ETH;
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS;
    }
  }
};

const computeSlippageAdjustedAmounts = (
  trade: Trade,
  allowedSlippage: number
): { [field in Field]?: TokenAmount } => {
  console.log('allowed slippage', allowedSlippage);
  const pct = new Percent(allowedSlippage, '10000');
  const results = {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  };
  console.log('slippage adjusted amts', results);
  return results;
};

// returns a function that will execute a swap, if the parameters are all valid
// and the user has approved the slippage adjusted input amount for the trade
const getExecutionDetails = ({
  accountAddress,
  allowedSlippage = INITIAL_ALLOWED_SLIPPAGE, // in bips, optional
  chainId,
  deadline = DEFAULT_DEADLINE_FROM_NOW, // in seconds from now, optional
  trade,
  providerOrSigner,
}) => {
  const recipient = accountAddress;

  if (!trade || !recipient) return null;

  // will always be defined
  const {
    [Field.INPUT]: slippageAdjustedInput,
    [Field.OUTPUT]: slippageAdjustedOutput,
  } = computeSlippageAdjustedAmounts(trade, allowedSlippage);

  if (!slippageAdjustedInput || !slippageAdjustedOutput) return null;

  if (!chainId || !providerOrSigner) {
    throw new Error('missing dependencies in onSwap callback');
  }

  const path = trade.route.path.map(t => t.address);

  const deadlineFromNow: number = Math.ceil(Date.now() / 1000) + deadline;

  const swapType = getSwapType(
    {
      [Field.INPUT]: trade.inputAmount.token,
      [Field.OUTPUT]: trade.outputAmount.token,
    },
    trade.tradeType === TradeType.EXACT_INPUT,
    chainId as ChainId
  );

  // let estimate: Function, method: Function,
  let methodNames: string[],
    args: (string | string[] | number)[],
    value: string = null;
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
}) => {
  const slippage = tradeDetails?.slippage?.toFixed(2).toString();
  const maxSlippage = Math.max(
    slippage + SlippageBufferInBips,
    DefaultMaxSlippageInBips
  );
  const executionDetails = getExecutionDetails({
    accountAddress,
    allowedSlippage: maxSlippage,
    chainId,
    providerOrSigner,
    trade: tradeDetails,
  });
  const { methodArguments, methodNames, value: rawValue } = executionDetails;

  const exchange = new Contract(
    UNISWAP_V2_ROUTER_ADDRESS,
    uniswapV2RouterABI,
    providerOrSigner
  );

  return {
    exchange,
    methodNames,
    updatedMethodArgs: methodArguments,
    value: rawValue,
  };
};

export const executeSwap = async ({
  accountAddress,
  chainId,
  gasLimit,
  gasPrice,
  methodName,
  tradeDetails,
  wallet = null,
}) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse) return null;
  const { exchange, updatedMethodArgs, value } = getContractExecutionDetails({
    accountAddress,
    chainId,
    providerOrSigner: walletToUse,
    tradeDetails,
  });
  const transactionParams = {
    gasLimit: gasLimit ? toHex(gasLimit) : undefined,
    gasPrice: gasPrice ? toHex(gasPrice) : undefined,
    ...(value ? { value } : {}),
  };
  return exchange[methodName](...updatedMethodArgs, transactionParams);
};

export const getChart = async (exchangeAddress, timeframe) => {
  const now = new Date();
  const timeframeKey = findKey(ChartTypes, type => type === timeframe);
  let startTime = getUnixTime(
    sub(now, {
      ...(timeframe === ChartTypes.max
        ? { years: 2 }
        : { [`${timeframeKey}s`]: 1 }),
      seconds: 1, // -1 seconds because we filter on greater than in the query
    })
  );

  let data = [];
  try {
    let dataEnd = false;
    while (!dataEnd) {
      const chartData = await uniswapClient
        .query({
          fetchPolicy: 'cache-first',
          query: UNISWAP_CHART_QUERY,
          variables: {
            date: startTime,
            exchangeAddress,
          },
        })
        .then(({ data: { exchangeDayDatas } }) =>
          exchangeDayDatas.map(({ date, tokenPriceUSD }) => [
            date,
            parseFloat(tokenPriceUSD),
          ])
        );

      data = data.concat(chartData);

      if (chartData.length !== 100) {
        dataEnd = true;
      } else {
        startTime = chartData[chartData.length - 1][0];
      }
    }
  } catch (err) {
    logger.log('error: ', err);
  }

  return data;
};

export const getAllTokens = async (tokenOverrides, excluded = []) => {
  const pageSize = 600;
  let allTokens = {};
  let data = [];
  try {
    let dataEnd = false;
    let skip = 0;
    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_TOKENS,
        variables: {
          excluded,
          first: pageSize,
          skip: skip,
        },
      });
      data = data.concat(result.data.tokens);
      skip = skip + pageSize;
      if (result.data.tokens.length < pageSize) {
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
      decimals: token.decimals,
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
  inputAmount: number,
  outputAmount: number,
  inputToken: Token,
  outputToken: Token,
  pairs: Record<string, Pair>,
  exactInput: boolean
): Trade | null => {
  if (!inputToken || !outputToken) {
    return null;
  }
  if (exactInput) {
    const inputRawAmount = convertAmountToRawAmount(
      convertNumberToString(inputAmount || 0),
      inputToken.decimals
    );

    const amountIn = new TokenAmount(inputToken, inputRawAmount);
    return Trade.bestTradeExactIn(Object.values(pairs), amountIn, outputToken, {
      maxNumResults: 1,
    })[0];
  } else {
    const outputRawAmount = convertAmountToRawAmount(
      convertNumberToString(outputAmount || 0),
      outputToken.decimals
    );
    const amountOut = new TokenAmount(outputToken, outputRawAmount);
    return Trade.bestTradeExactOut(
      Object.values(pairs),
      inputToken,
      amountOut,
      {
        maxNumResults: 1,
      }
    )[0];
  }
};
