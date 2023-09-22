import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from './web3';
import { metadataClient } from '@/apollo/client';
import { CONTRACT_FUNCTION } from '@/apollo/queries';
import {
  RainbowTransaction,
  TransactionStatus,
  TransactionDirection,
  TransactionTypes,
  TransactionType,
  ZerionTransaction,
} from '@/entities';
import store from '@/redux/store';
import { transactionSignaturesDataAddNewSignature } from '@/redux/transactionSignatures';
import { SIGNATURE_REGISTRY_ADDRESS, signatureRegistryABI } from '@/references';
import { ethereumUtils, isLowerCaseMatch } from '@/utils';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { getTitle, getTransactionLabel } from '@/parsers';
import { isZero } from '@/helpers/utilities';
import { fetchWalletENSAvatars, fetchWalletNames } from '@/redux/wallets';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { IS_TEST } from '@/env';
import { API_BASE_URL } from '@rainbow-me/swaps';
import { logger, RainbowError } from '@/logger';

const flashbotsApi = new RainbowFetchClient({
  baseURL: 'https://protect.flashbots.net',
});

const rainbowSwapsApi = new RainbowFetchClient({
  baseURL: API_BASE_URL,
});

const parseSignatureToTitle = (signature: string) => {
  const rawName = signature.match(/^([^)(]*)\((.*)\)([^)(]*)$/u);
  let parsedName = '';

  if (rawName) {
    parsedName =
      rawName[1].charAt(0).toUpperCase() +
      rawName[1]
        .slice(1)
        .split(/(?=[A-Z])/u)
        .join(' ');
  }
  return parsedName;
};

const timeoutPromise = new Promise((_, reject) => {
  setTimeout(reject, 800);
});

export const getTransactionMethodName = async (
  transaction: ZerionTransaction
) => {
  try {
    const { signatures } = store.getState().transactionSignatures;
    // only being used on mainnet transactions, so we can use the default web3 provider
    const txn = await web3Provider.getTransaction(transaction.hash);
    const bytes = txn?.data?.substring(0, 10) || '';
    let signature = signatures[bytes] || '';
    if (signature) return signature;
    try {
      const response = await metadataClient.queryWithTimeout(
        {
          query: CONTRACT_FUNCTION,
          variables: {
            chainID: 1,
            hex: bytes,
          },
        },
        800
      );
      if (!isEmpty(response?.data?.contractFunction?.text)) {
        signature = response.data.contractFunction.text;
      }
      // eslint-disable-next-line no-empty
    } catch (e) {}
    if (!signature) {
      try {
        const contract = new Contract(
          SIGNATURE_REGISTRY_ADDRESS,
          signatureRegistryABI,
          web3Provider!
        );
        signature = await Promise.race([
          contract.entries(bytes),
          timeoutPromise,
        ]);
        // eslint-disable-next-line no-empty
      } catch (e) {}
    }
    const parsedSignature = parseSignatureToTitle(signature);
    store.dispatch(
      transactionSignaturesDataAddNewSignature(parsedSignature, bytes)
    );
    return parsedSignature;
  } catch (e) {
    return '';
  }
};

/**
 * Returns the `TransactionStatus` that represents completion for a given
 * transaction type.
 *
 * @param type The transaction type.
 * @returns The confirmed status.
 */
const getConfirmedState = (type?: TransactionType): TransactionStatus => {
  switch (type) {
    case TransactionTypes.authorize:
      return TransactionStatus.approved;
    case TransactionTypes.sell:
      return TransactionStatus.sold;
    case TransactionTypes.deposit:
      return TransactionStatus.deposited;
    case TransactionTypes.withdraw:
      return TransactionStatus.withdrew;
    case TransactionTypes.receive:
      return TransactionStatus.received;
    case TransactionTypes.purchase:
      return TransactionStatus.purchased;
    default:
      return TransactionStatus.sent;
  }
};

export const getTransactionReceiptStatus = async (
  transaction: RainbowTransaction,
  nonceAlreadyIncluded: boolean,
  txObj?: TransactionResponse
): Promise<TransactionStatus> => {
  let receipt;
  let status;
  try {
    if (txObj) {
      receipt = await txObj.wait();
    }
  } catch (e: any) {
    // https://docs.ethers.io/v5/api/providers/types/#providers-TransactionResponse
    if (e.transaction) {
      // if a transaction field exists, it was confirmed but failed
      status = TransactionStatus.failed;
    } else {
      // cancelled or replaced
      status = TransactionStatus.cancelled;
    }
  }
  status = receipt?.status || 0;

  if (!isZero(status)) {
    const isSelf = isLowerCaseMatch(
      transaction?.from || '',
      transaction?.to || ''
    );
    const transactionDirection = isSelf
      ? TransactionDirection.self
      : TransactionDirection.out;
    const transactionStatus =
      transaction.status === TransactionStatus.cancelling
        ? TransactionStatus.cancelled
        : getConfirmedState(transaction?.type);
    status = getTransactionLabel({
      direction: transactionDirection,
      pending: false,
      protocol: transaction?.protocol,
      status: transactionStatus,
      type: transaction?.type,
    });
  } else if (nonceAlreadyIncluded) {
    status = TransactionStatus.unknown;
  } else {
    status = TransactionStatus.failed;
  }
  return status;
};

export const getTransactionFlashbotStatus = async (
  transaction: RainbowTransaction,
  txHash: string
) => {
  try {
    const fbStatus = await flashbotsApi.get(`/tx/${txHash}`);
    const flashbotStatus = fbStatus.data.status;
    // Make sure it wasn't dropped after 25 blocks or never made it
    if (flashbotStatus === 'FAILED' || flashbotStatus === 'CANCELLED') {
      const transactionStatus = TransactionStatus.dropped;
      const minedAt = Math.floor(Date.now() / 1000);
      const title = getTitle({
        protocol: transaction.protocol,
        status: transactionStatus,
        type: transaction.type,
      });
      return { status: transactionStatus, minedAt, pending: false, title };
    }
  } catch (e) {
    //
  }
  return null;
};

export const getTransactionSocketStatus = async (
  pendingTransaction: RainbowTransaction
) => {
  const { swap } = pendingTransaction;
  const txHash = ethereumUtils.getHash(pendingTransaction);
  let pending = true;
  const minedAt: number | null = Math.floor(Date.now() / 1000);
  let status = swap?.isBridge
    ? TransactionStatus.bridging
    : TransactionStatus.swapping;
  try {
    const socketStatus = await rainbowSwapsApi.get('/v1/bridge-status', {
      params: {
        txHash: txHash || '',
        fromChainId: String(swap?.fromChainId),
        toChainId: String(swap?.toChainId),
      },
    });
    const socketResponse = socketStatus.data;
    if (socketResponse.success) {
      if (socketResponse?.result?.sourceTxStatus === 'COMPLETED') {
        status = swap?.isBridge
          ? TransactionStatus.bridging
          : TransactionStatus.swapping;
      }
      if (socketResponse?.result?.DestinationTxStatus === 'COMPLETED') {
        status = swap?.isBridge
          ? TransactionStatus.bridged
          : TransactionStatus.swapped;
        pending = false;
      }
      if (
        socketResponse?.result?.DestinationTxStatus === 'FAILED' ||
        socketResponse?.result?.sourceTxStatus === 'FAILED'
      ) {
        status = TransactionStatus.failed;
        pending = false;
      }
    } else if (socketResponse.error) {
      logger.warn(
        'getTransactionSocketStatus transaction check failed',
        socketResponse.error
      );
      status = TransactionStatus.failed;
      pending = false;
    }
  } catch (e) {
    logger.error(
      new RainbowError('getTransactionSocketStatus transaction check caught')
    );
    if (IS_TEST) {
      status = swap?.isBridge
        ? TransactionStatus.bridged
        : TransactionStatus.swapped;
      pending = false;
    }
  }

  const title = getTitle({
    protocol: pendingTransaction.protocol,
    status,
    type: pendingTransaction.type,
  });

  return { status, minedAt, pending, title };
};

export const getPendingTransactionData = (
  transaction: RainbowTransaction,
  transactionStatus: TransactionStatus
) => {
  const minedAt = Math.floor(Date.now() / 1000);
  const title = getTitle({
    protocol: transaction.protocol,
    status: transactionStatus,
    type: transaction.type,
  });
  return { title, minedAt, pending: false, status: transactionStatus };
};

export const fetchWalletENSDataAfterRegistration = async () => {
  await store.dispatch(fetchWalletENSAvatars());
  store.dispatch(fetchWalletNames());
};
