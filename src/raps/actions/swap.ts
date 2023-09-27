import { Signer } from '@ethersproject/abstract-signer';
import {
  ChainId,
  ETH_ADDRESS,
  fillQuote,
  Quote,
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

import { toHex } from '@/handlers/web3';
import { parseGasParamAmounts } from '@/parsers';
import { additionalDataUpdateL2AssetToWatch } from '@/redux/additionalAssetsData';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import { AllowancesCache, ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { estimateSwapGasLimit } from '@/handlers/swap';
import { MMKV } from 'react-native-mmkv';
import { STORAGE_IDS } from '@/model/mmkv';
import { REFERRER } from '@/references';
import { overrideWithFastSpeedIfNeeded } from '../utils';

export const swapMetadataStorage = new MMKV({
  id: STORAGE_IDS.SWAPS_METADATA_STORAGE,
});
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
  wallet: Signer | null;
  permit: boolean;
  flashbots: boolean;
}) => {
  if (!wallet || !tradeDetails) return null;
  const walletAddress = await wallet.getAddress();

  const { sellTokenAddress, buyTokenAddress } = tradeDetails;
  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    gasPrice,
    // EIP-1559 like networks
    maxFeePerGas,
    maxPriorityFeePerGas,
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
      walletAddress,
      chainId
    );
    return wrapNativeAsset(
      tradeDetails.buyAmount,
      wallet,
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
      walletAddress,
      chainId
    );
    return unwrapNativeAsset(
      tradeDetails.sellAmount,
      wallet,
      chainId,
      transactionParams
    );
    // Swap
  } else {
    logger.debug(
      'FILLQUOTE',
      tradeDetails,
      transactionParams,
      walletAddress,
      permit,
      chainId
    );
    return fillQuote(
      tradeDetails,
      transactionParams,
      wallet,
      permit,
      chainId,
      REFERRER
    );
  }
};

const swap = async (
  wallet: Signer,
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
  let gasParams = parseGasParamAmounts(selectedGasFee);

  if (currentRap.actions.length - 1 > index) {
    gasParams = overrideWithFastSpeedIfNeeded({
      gasParams,
      chainId,
      gasFeeParamsBySpeed,
    });
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
      const walletAddress = await wallet.getAddress();
      // Clear the allowance
      const cacheKey = toLower(
        `${walletAddress}|${tradeDetails.sellTokenAddress}|${tradeDetails.to}`
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
    hash: swap?.hash ?? null,
    network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
    nonce: swap?.nonce ?? null,
    protocol: ProtocolType.uniswap,
    status: TransactionStatus.swapping,
    to: swap?.to ?? null,
    type: TransactionType.trade,
    value: (swap && toHex(swap.value)) || undefined,
  };
  logger.log(`[${actionName}] adding new txn`, newTransaction);

  if (parameters.meta && swap?.hash) {
    swapMetadataStorage.set(
      swap.hash.toLowerCase(),
      JSON.stringify({ type: 'swap', data: parameters.meta })
    );
  }

  dispatch(
    dataAddNewTransaction(
      newTransaction,
      accountAddress,
      false,
      // @ts-ignore
      wallet?.provider
    )
  );
  return swap?.nonce;
};

export { swap };
