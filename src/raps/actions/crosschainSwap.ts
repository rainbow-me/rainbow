import { Wallet } from '@ethersproject/wallet';
import { Signer } from '@ethersproject/abstract-signer';
import {
  ChainId,
  CrosschainQuote,
  fillCrosschainQuote,
  SwapType,
} from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import {
  CrosschainSwapActionParameters,
  Rap,
  RapExchangeActionParameters,
} from '../common';
import { ProtocolType, TransactionStatus, TransactionType } from '@/entities';

import { toHex } from '@/handlers/web3';
import { parseGasParamAmounts } from '@/parsers';
import { dataAddNewTransaction } from '@/redux/data';
import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { estimateCrosschainSwapGasLimit } from '@/handlers/swap';
import { additionalDataUpdateL2AssetToWatch } from '@/redux/additionalAssetsData';
import { swapMetadataStorage } from './swap';
import { REFERRER } from '@/references';
import { overrideWithFastSpeedIfNeeded } from '../utils';

const actionName = 'crosschainSwap';

export const executeCrosschainSwap = async ({
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
  tradeDetails: CrosschainQuote | null;
  wallet: Wallet | Signer | null;
  permit: boolean;
  flashbots: boolean;
}) => {
  if (!wallet || !tradeDetails) return null;
  const walletAddress = await wallet.getAddress();

  const transactionParams = {
    gasLimit: toHex(gasLimit) || undefined,
    // In case it's an L2 with legacy gas price like arbitrum
    ...(gasPrice ? { gasPrice } : {}),
    // EIP-1559 like networks
    ...(maxFeePerGas ? { maxFeePerGas } : {}),
    ...(maxPriorityFeePerGas ? { maxPriorityFeePerGas } : {}),
    nonce: nonce ? toHex(nonce) : undefined,
  };

  logger.debug(
    'FILLCROSSCHAINSWAP',
    tradeDetails,
    transactionParams,
    walletAddress,
    permit,
    chainId
  );
  return fillCrosschainQuote(tradeDetails, transactionParams, wallet, REFERRER);
};

const crosschainSwap = async (
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
    chainId,
    requiresApprove,
  } = parameters as CrosschainSwapActionParameters;
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
    const newGasLimit = await estimateCrosschainSwapGasLimit({
      chainId: Number(chainId),
      requiresApprove,
      tradeDetails: tradeDetails as CrosschainQuote,
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
      tradeDetails,
      wallet,
    };

    // @ts-ignore
    swap = await executeCrosschainSwap(swapParams);
    if (swap?.hash) {
      dispatch(
        additionalDataUpdateL2AssetToWatch({
          hash: swap?.hash,
          inputCurrency,
          network: ethereumUtils.getNetworkFromChainId(Number(chainId)),
          outputCurrency,
          userAddress: accountAddress,
        })
      );
    }
  } catch (e) {
    logger.sentry('Error', e);
    const fakeError = new Error('Failed to execute swap');
    captureException(fakeError);
    throw e;
  }

  logger.log(`[${actionName}] response`, swap);

  const isBridge = inputCurrency.symbol === outputCurrency.symbol;
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
    protocol: ProtocolType.socket,
    status: isBridge ? TransactionStatus.bridging : TransactionStatus.swapping,
    to: swap?.to,
    type: TransactionType.trade,
    value: (swap && toHex(swap.value)) || undefined,
    swap: {
      type: SwapType.crossChain,
      fromChainId: ethereumUtils.getChainIdFromType(inputCurrency?.type),
      toChainId: ethereumUtils.getChainIdFromType(outputCurrency?.type),
      isBridge,
    },
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
      // @ts-ignore
      newTransaction,
      accountAddress,
      false,
      wallet?.provider
    )
  );
  return swap?.nonce;
};

export { crosschainSwap };
