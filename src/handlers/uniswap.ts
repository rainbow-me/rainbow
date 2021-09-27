import { Provider } from '@ethersproject/abstract-provider';
import { Signer } from '@ethersproject/abstract-signer';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { captureException } from '@sentry/react-native';
import {
  ChainId,
  CurrencyAmount,
  Percent,
  Token,
  Trade,
  TradeType,
  WETH,
} from '@uniswap/sdk';
import { get, mapKeys, mapValues, toLower } from 'lodash';
import { uniswapClient } from '../apollo/client';
import { UNISWAP_ALL_TOKENS } from '../apollo/queries';
import { loadWallet } from '../model/wallet';
import { estimateGasWithPadding, toHex, web3Provider } from './web3';
import { Asset } from '@rainbow-me/entities';
import { Network } from '@rainbow-me/networkTypes';
import store from '@rainbow-me/redux/store';
import {
  uniswapLoadedAllTokens,
  uniswapUpdateTokens,
} from '@rainbow-me/redux/uniswap';
import {
  ETH_ADDRESS,
  ethUnits,
  UNISWAP_TESTNET_TOKEN_LIST,
  UNISWAP_V2_ROUTER_ABI,
  UNISWAP_V2_ROUTER_ADDRESS,
} from '@rainbow-me/references';
import logger from 'logger';

export enum Field {
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

const UniswapPageSize = 1000;

// 20 minutes, denominated in seconds
const DEFAULT_DEADLINE_FROM_NOW = 60 * 20;

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
  accountAddress,
  chainId,
  inputCurrency,
  outputCurrency,
  requiresApprove,
  slippage,
  tradeDetails,
}: {
  accountAddress: string;
  chainId: ChainId;
  inputCurrency: Asset;
  outputCurrency: Asset;
  requiresApprove?: boolean;
  slippage: number;
  tradeDetails: Trade | null;
}): Promise<{
  gasLimit: string | number;
  methodName?: string | null;
}> => {
  let methodName = null;
  if (!tradeDetails) {
    logger.sentry('No trade details in estimateSwapGasLimit');
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
      inputCurrency,
      outputCurrency,
      providerOrSigner: web3Provider,
      slippage,
      tradeDetails,
    });

    const params = { from: accountAddress, ...(value ? { value } : {}) };
    const gasEstimates: (string | undefined)[] = await Promise.all(
      methodNames.map((methodName: string) =>
        estimateGasWithPadding(
          params,
          exchange.estimateGas[methodName],
          updatedMethodArgs
        )
          .then((value: string) => value)
          .catch((error: Error) => {
            logger.sentry(
              `Error estimating swap method ${methodName} with: ${error}`
            );
            return undefined;
          })
      )
    );

    // we expect failures from left to right, so throw if we see failures
    // from right to left
    for (let i = 0; i < gasEstimates.length - 1; i++) {
      // if the Fee on Transfer method fails, but the regular method does not, we should not
      // use the regular method. this probably means something is wrong with the fot token.
      if (gasEstimates[i] && !gasEstimates[i + 1]) {
        logger.sentry(
          'Issue with Fee on Transfer estimate in estimateSwapGasLimit'
        );
        return { gasLimit: ethUnits.basic_swap, methodName: null };
      }
    }

    const indexOfSuccessfulEstimation = gasEstimates.findIndex(
      gasEstimate => !!gasEstimate
    );

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      logger.sentry('all swap estimates failed in estimateSwapGasLimit');
      return {
        gasLimit: ethUnits.basic_swap,
        methodName: requiresApprove ? methodNames[0] : null,
      };
    } else {
      methodName = methodNames[indexOfSuccessfulEstimation];
      const gasEstimate = gasEstimates[indexOfSuccessfulEstimation];
      const gasLimit: string | number = gasEstimate ?? ethUnits.basic_swap;
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
  tokens: { [field in Field]: Asset },
  chainId: ChainId,
  isExactIn: boolean
): SwapType => {
  if (isExactIn) {
    if (tokens[Field.INPUT].address === ETH_ADDRESS) {
      return SwapType.EXACT_ETH_FOR_TOKENS;
    } else if (tokens[Field.OUTPUT].address === ETH_ADDRESS) {
      return SwapType.EXACT_TOKENS_FOR_ETH;
    } else {
      return SwapType.EXACT_TOKENS_FOR_TOKENS;
    }
  } else {
    if (tokens[Field.INPUT].address === ETH_ADDRESS) {
      return SwapType.ETH_FOR_EXACT_TOKENS;
    } else if (tokens[Field.OUTPUT].address === ETH_ADDRESS) {
      return SwapType.TOKENS_FOR_EXACT_ETH;
    } else {
      return SwapType.TOKENS_FOR_EXACT_TOKENS;
    }
  }
};

export const computeSlippageAdjustedAmounts = (
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
  inputCurrency: Asset,
  outputCurrency: Asset,
  trade: Trade,
  providerOrSigner: Provider | Signer,
  allowedSlippage: number,
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
      [Field.INPUT]: inputCurrency,
      [Field.OUTPUT]: outputCurrency,
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
  inputCurrency,
  outputCurrency,
  providerOrSigner,
  slippage,
  tradeDetails,
}: {
  accountAddress: string;
  chainId: ChainId;
  inputCurrency: Asset;
  outputCurrency: Asset;
  providerOrSigner: Provider | Signer;
  slippage: number;
  tradeDetails: Trade;
}) => {
  const { methodArguments, methodNames, value } = getExecutionDetails(
    accountAddress,
    chainId,
    inputCurrency,
    outputCurrency,
    tradeDetails,
    providerOrSigner,
    slippage
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
  inputCurrency,
  nonce,
  outputCurrency,
  methodName,
  slippage,
  tradeDetails,
  wallet,
}: {
  accountAddress: string;
  chainId: ChainId;
  gasLimit: string | number;
  gasPrice: string;
  inputCurrency: Asset;
  nonce?: number;
  outputCurrency: Asset;
  methodName: string;
  slippage: number;
  tradeDetails: Trade | null;
  wallet: Wallet | null;
}) => {
  const walletToUse = wallet || (await loadWallet());
  if (!walletToUse || !tradeDetails) return null;
  const { exchange, updatedMethodArgs, value } = getContractExecutionDetails({
    accountAddress,
    chainId,
    inputCurrency,
    outputCurrency,
    providerOrSigner: walletToUse,
    slippage,
    tradeDetails,
  });

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    gasPrice: toHex(gasPrice) || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
    ...(value ? { value } : {}),
  };
  return exchange[methodName](...updatedMethodArgs, transactionParams);
};

export const getAllTokens = async () => {
  const { dispatch } = store;
  try {
    let dataEnd = false;
    //setting an extremely safe upper limit for token volume
    let lastUSDVolume = '1000000000000';

    while (!dataEnd) {
      let result = await uniswapClient.query({
        query: UNISWAP_ALL_TOKENS,
        variables: {
          first: UniswapPageSize,
          lastUSDVolume,
        },
      });
      const resultTokens = result?.data?.tokens || [];
      const lastItem = resultTokens[resultTokens.length - 1];
      lastUSDVolume = lastItem?.tradeVolumeUSD ?? '';
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
