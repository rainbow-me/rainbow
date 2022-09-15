import { Wallet } from '@ethersproject/wallet';
import {
  ChainId,
  ETH_ADDRESS,
  fillQuote,
  Quote,
  CrosschainQuote,
  unwrapNativeAsset,
  wrapNativeAsset,
  WRAPPED_ASSET,
} from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { toLower } from 'lodash';
import {
  Rap,
  RapExchangeActionParameters,
  SwapActionParameters,
} from '../common';
import { ProtocolType, TransactionStatus, TransactionType } from '@/entities';

import {
  getFlashbotsProvider,
  getProviderForNetwork,
  isL2Network,
  toHex,
} from '@/handlers/web3';
import { parseGasParamsForTransaction } from '@/parsers';
import { additionalDataUpdateL2AssetToWatch } from '@/redux/additionalAssetsData';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import { greaterThan } from '@/helpers/utilities';
import { AllowancesCache, ethereumUtils, gasUtils } from '@/utils';
import logger from '@/utils/logger';
import { Network } from '@/helpers';
import { loadWallet } from '@/model/wallet';
import {
  estimateCrosschainSwapGasLimit,
  estimateSwapGasLimit,
} from '@/handlers/swap';

const actionName = 'swap';

export const executeSwap = async ({
  chainId,
  gasLimit,
  maxFeePerGas,
  maxPriorityFeePerGas,
  gasPrice,
  nonce,
  tradeDetails,
  wallet,
  permit = false,
  flashbots = false,
}: {
  chainId: ChainId;
  gasLimit: string | number;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  gasPrice: string;
  nonce?: number;
  tradeDetails: Quote | null;
  wallet: Wallet | null;
  permit: boolean;
  flashbots: boolean;
}) => {
  let walletToUse = wallet;
  const network = ethereumUtils.getNetworkFromChainId(chainId);
  let provider;

  // Switch to the flashbots provider if enabled
  if (flashbots && network === Network.mainnet) {
    logger.debug('flashbots provider being set on mainnet');
    provider = await getFlashbotsProvider();
  } else {
    logger.debug('normal provider being set', network);
    provider = await getProviderForNetwork(network);
  }

  if (!walletToUse) {
    walletToUse = await loadWallet(undefined, true, provider);
  } else {
    walletToUse = new Wallet(walletToUse.privateKey, provider);
  }

  if (!walletToUse || !tradeDetails) return null;

  const { sellTokenAddress, buyTokenAddress } = tradeDetails;
  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice: gasPrice || undefined,
    // EIP-1559 like networks
    maxFeePerGas: maxFeePerGas || undefined,
    maxPriorityFeePerGas: maxPriorityFeePerGas || undefined,
    nonce: nonce ? toHex(nonce) : undefined,
  };

  // Wrap Eth
  if (
    sellTokenAddress === ETH_ADDRESS &&
    buyTokenAddress === WRAPPED_ASSET[chainId]
  ) {
    logger.debug(
      'wrapping native asset',
      tradeDetails.buyAmount,
      walletToUse.address,
      chainId
    );
    return wrapNativeAsset(
      tradeDetails.buyAmount,
      walletToUse,
      chainId,
      transactionParams
    );
    // Unwrap Weth
  } else if (
    sellTokenAddress === WRAPPED_ASSET[chainId] &&
    buyTokenAddress === ETH_ADDRESS
  ) {
    logger.debug(
      'unwrapping native asset',
      tradeDetails.sellAmount,
      walletToUse.address,
      chainId
    );
    return unwrapNativeAsset(
      tradeDetails.sellAmount,
      walletToUse,
      chainId,
      transactionParams
    );
    // Swap
  } else {
    logger.debug(
      'FILLQUOTE',
      tradeDetails,
      transactionParams,
      walletToUse.address,
      permit,
      chainId
    );
    return fillQuote(
      tradeDetails,
      transactionParams,
      walletToUse,
      permit,
      chainId
    );
  }
};

const swap = async (
  wallet: Wallet,
  currentRap: Rap,
  index: number,
  parameters: RapExchangeActionParameters,
  baseNonce?: number
): Promise<number | undefined> => {
  logger.log(`[${actionName}] base nonce`, baseNonce, 'index:', index);
  const {
    inputAmount,
    tradeDetails,
    permit,
    chainId,
    requiresApprove,
  } = parameters as SwapActionParameters;
  const { dispatch } = store;
  const { accountAddress } = store.getState().settings;
  const { inputCurrency, outputCurrency } = store.getState().swap;
  const { gasFeeParamsBySpeed, selectedGasFee } = store.getState().gas;
  const gasParams = parseGasParamsForTransaction(selectedGasFee);
  // if swap isn't the last action, use fast gas or custom (whatever is faster)
  const isL2 = isL2Network(
    ethereumUtils.getNetworkFromChainId(parameters?.chainId || ChainId.mainnet)
  );
  const emptyGasFee = isL2
    ? !gasParams.gasPrice
    : !gasParams.maxFeePerGas || !gasParams.maxPriorityFeePerGas;

  if (currentRap.actions.length - 1 > index || emptyGasFee) {
    const fastMaxFeePerGas =
      gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxFeePerGas?.amount;
    const fastMaxPriorityFeePerGas =
      gasFeeParamsBySpeed?.[gasUtils.FAST]?.maxPriorityFeePerGas?.amount;

    if (greaterThan(fastMaxFeePerGas, gasParams?.maxFeePerGas || 0)) {
      gasParams.maxFeePerGas = fastMaxFeePerGas;
    }
    if (
      greaterThan(
        fastMaxPriorityFeePerGas,
        gasParams?.maxPriorityFeePerGas || 0
      )
    ) {
      gasParams.maxPriorityFeePerGas = fastMaxPriorityFeePerGas;
    }
  }
  let gasLimit;
  try {
    const newGasLimit = await estimateSwapGasLimit({
      chainId: Number(chainId),
      requiresApprove,
      tradeDetails,
    });
    gasLimit = newGasLimit;
  } catch (e) {
    logger.sentry(`[${actionName}] error estimateSwapGasLimit`);
    captureException(e);
    throw e;
  }

  let swap;
  try {
    logger.sentry(`[${actionName}] executing rap`, {
      ...gasParams,
      gasLimit,
    });
    const nonce = baseNonce ? baseNonce + index : undefined;

    const swapParams = {
      ...gasParams,
      chainId,
      flashbots: !!parameters.flashbots,
      gasLimit,
      nonce,
      permit: !!permit,
      tradeDetails,
      wallet,
    };

    // @ts-ignore
    swap = await executeSwap(swapParams);
    dispatch(
      additionalDataUpdateL2AssetToWatch({
        hash: swap?.hash || '',
        inputCurrency,
        network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
        outputCurrency,
        userAddress: accountAddress,
      })
    );

    if (permit) {
      // Clear the allowance
      const cacheKey = toLower(
        `${wallet.address}|${tradeDetails.sellTokenAddress}|${tradeDetails.to}`
      );
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete AllowancesCache.cache[cacheKey];
    }
  } catch (e) {
    logger.sentry('Error', e);
    const fakeError = new Error('Failed to execute swap');
    captureException(fakeError);
    throw e;
  }

  logger.log(`[${actionName}] response`, swap);

  const newTransaction = {
    ...gasParams,
    amount: inputAmount,
    asset: inputCurrency,
    data: swap?.data,
    flashbots: parameters.flashbots,
    from: accountAddress,
    gasLimit,
    hash: swap?.hash,
    network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
    nonce: swap?.nonce,
    protocol: ProtocolType.uniswap,
    status: TransactionStatus.swapping,
    to: swap?.to,
    type: TransactionType.trade,
    value: (swap && toHex(swap.value)) || undefined,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);

  dispatch(
    dataAddNewTransaction(
      // @ts-ignore
      newTransaction,
      accountAddress,
      false,
      wallet?.provider as any
    )
  );
  return swap?.nonce;
};

export { swap };
