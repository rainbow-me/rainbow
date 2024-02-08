import { Wallet } from '@ethersproject/wallet';
import { Signer } from '@ethersproject/abstract-signer';
import { ChainId, CrosschainQuote, fillCrosschainQuote, SwapType } from '@rainbow-me/swaps';
import { captureException } from '@sentry/react-native';
import { CrosschainSwapActionParameters, Rap, RapExchangeActionParameters } from '../common';
import { NewTransaction } from '@/entities';

import { toHex } from '@/handlers/web3';
import { parseGasParamAmounts } from '@/parsers';
import store from '@/redux/store';
import { ethereumUtils } from '@/utils';
import logger from '@/utils/logger';
import { estimateCrosschainSwapGasLimit } from '@/handlers/swap';
import { swapMetadataStorage } from './swap';
import { REFERRER } from '@/references';
import { overrideWithFastSpeedIfNeeded } from '../utils';
import { addNewTransaction } from '@/state/pendingTransactions';

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

  logger.debug('FILLCROSSCHAINSWAP', tradeDetails, transactionParams, walletAddress, permit, chainId);
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
  const { inputAmount, tradeDetails, chainId, requiresApprove } = parameters as CrosschainSwapActionParameters;
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
  } catch (e) {
    logger.sentry('Error', e);
    const fakeError = new Error('Failed to execute swap');
    captureException(fakeError);
    throw e;
  }

  logger.log(`[${actionName}] response`, swap);

  const isBridge = inputCurrency.symbol === outputCurrency.symbol;
  if (!swap?.hash) return;

  const newTransaction: NewTransaction = {
    data: swap?.data,
    from: accountAddress,
    to: swap?.to ?? null,
    value: tradeDetails?.value?.toString() || '',
    asset: outputCurrency,
    changes: [
      {
        direction: 'out',
        asset: inputCurrency,
        value: tradeDetails.sellAmount.toString(),
      },
      {
        direction: 'in',
        asset: outputCurrency,
        value: tradeDetails.buyAmount.toString(),
      },
    ],
    hash: swap.hash,
    network: inputCurrency.network,
    nonce: swap?.nonce,
    status: 'pending',
    type: 'swap',
    flashbots: parameters.flashbots,
    swap: {
      type: SwapType.crossChain,
      fromChainId: ethereumUtils.getChainIdFromNetwork(inputCurrency?.network),
      toChainId: ethereumUtils.getChainIdFromNetwork(outputCurrency?.network),
      isBridge,
    },
    ...gasParams,
  };

  addNewTransaction({
    address: accountAddress,
    transaction: newTransaction,
    network: inputCurrency.network,
  });
  logger.log(`[${actionName}] adding new txn`, newTransaction);

  if (parameters.meta && swap?.hash) {
    swapMetadataStorage.set(swap.hash.toLowerCase(), JSON.stringify({ type: 'swap', data: parameters.meta }));
  }

  return swap?.nonce;
};

export { crosschainSwap };
