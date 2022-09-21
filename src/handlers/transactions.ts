import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from './web3';
import { metadataClient } from '@/apollo/client';
import { CONTRACT_FUNCTION } from '@/apollo/queries';
import {
  RainbowTransaction,
  TransactionDirection,
  TransactionStatus,
  TransactionType,
  TransactionTypes,
  ZerionTransaction,
} from '@/entities';
import store from '@/redux/store';
import { transactionSignaturesDataAddNewSignature } from '@/redux/transactionSignatures';
import { SIGNATURE_REGISTRY_ADDRESS, signatureRegistryABI } from '@/references';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { getTitle, getTransactionLabel } from '@/parsers';
import { isZero } from '@/helpers/utilities';
import { fetchWalletENSAvatars, fetchWalletNames } from '@/redux/wallets';
import { isLowerCaseMatch } from '@/utils';

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

export const getTransactionFlashbotStatus = async (txHash: string) => {
  const fbStatus = await fetch(`https://protect.flashbots.net/tx/${txHash}`);
  const fbResponse = await fbStatus.json();
  return fbResponse.status;
};

export const getPendingTransaction = (
  transaction: RainbowTransaction,
  status: TransactionStatus
) => {
  const updatedPending = { ...transaction };
  const minedAt = Math.floor(Date.now() / 1000);
  const title = getTitle({
    protocol: transaction.protocol,
    status,
    type: transaction.type,
  });
  updatedPending.title = title;
  updatedPending.pending = false;
  updatedPending.minedAt = minedAt;
  return updatedPending;
};

export const fetchWalletENSDataAfterRegistration = async () => {
  await store.dispatch(fetchWalletENSAvatars());
  store.dispatch(fetchWalletNames());
};
