import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from './web3';
import { metadataClient } from '@/apollo/client';
import { CONTRACT_FUNCTION } from '@/apollo/queries';
import {
  RainbowTransaction,
  TransactionStatus,
  TransactionStatusTypes,
  TransactionDirection,
  TransactionTypes,
  TransactionType,
  ZerionTransaction,
} from '@/entities';
import store from '@/redux/store';
import { transactionSignaturesDataAddNewSignature } from '@/redux/transactionSignatures';
import { SIGNATURE_REGISTRY_ADDRESS, signatureRegistryABI } from '@/references';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '@/helpers/transactions';
import lang from 'i18n-js';
import { isValidDomainFormat } from '@/helpers/validators';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
  isLowerCaseMatch,
} from '@/utils';
import { getRandomColor } from '@/styles/colors';
import startCase from 'lodash/startCase';
import {
  getShortTransactionActionId,
  TransactionActions,
} from '@/helpers/transactionActions';
import Routes from '@rainbow-me/routes';
import { Navigation } from '@/navigation';
import { Contact } from '@/redux/contacts';
import { Network } from '@/helpers';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { getTitle, getTransactionLabel } from '@/parsers';
import { isZero } from '@/helpers/utilities';
import { fetchWalletENSAvatars, fetchWalletNames } from '@/redux/wallets';
import { RainbowFetchClient } from '@/rainbow-fetch';
import { IS_TEST } from '@/env';
import { API_BASE_URL } from '@rainbow-me/swaps';
import { swapMetadataStorage } from '@/raps/actions/swap';
import { SwapMetadata } from '@/raps/common';
import WalletTypes from '@/helpers/walletTypes';
import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import { getExperimetalFlag, NEW_TRANSACTION_DETAILS } from '@/config';

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

export const showTransactionDetailsSheet = (
  transactionDetails: RainbowTransaction,
  contacts: { [p: string]: Contact },
  accountAddress: string
) => {
  // TODO: APP-298 Clean up old transaction details sheet code after releasing new one
  const isNewTransactionSheetEnabled = getExperimetalFlag(
    NEW_TRANSACTION_DETAILS
  );
  if (isNewTransactionSheetEnabled) {
    return void Navigation.handleAction(Routes.TRANSACTION_DETAILS, {
      transaction: transactionDetails,
    });
  }
  // Old TX details action sheet code
  const { hash, from, minedAt, pending, to, status, type } = transactionDetails;
  const network = transactionDetails.network ?? Network.mainnet;

  // get info to try swap again
  const parentTxHash = ethereumUtils.getHash(transactionDetails);
  const data = swapMetadataStorage.getString(parentTxHash?.toLowerCase() ?? '');
  const wrappedMeta = data ? JSON.parse(data) : {};
  let parsedMeta: undefined | SwapMetadata;
  if (wrappedMeta?.type === 'swap') {
    parsedMeta = wrappedMeta.data as SwapMetadata;
  }

  const isReadOnly =
    store.getState().wallets.selected?.type === WalletTypes.readOnly ?? true;
  const isRetryButtonVisible =
    !isReadOnly && status === TransactionStatus.failed && !!parsedMeta;

  const date = getHumanReadableDate(minedAt);
  const isSent =
    status === TransactionStatusTypes.sending ||
    status === TransactionStatusTypes.sent;
  const showContactInfo = hasAddableContact(status, type);
  const headerInfo = {
    address: '',
    divider: isSent
      ? lang.t('account.tx_to_lowercase')
      : lang.t('account.tx_from_lowercase'),
    type: (status?.charAt(0)?.toUpperCase() ?? '') + (status?.slice(1) ?? ''),
  };

  const contactAddress = (isSent ? to : from) as string;
  const contact = contacts[contactAddress];
  let contactColor = 0;

  if (contact) {
    headerInfo.address = contact.nickname;
    contactColor = contact.color;
  } else {
    headerInfo.address = isValidDomainFormat(contactAddress)
      ? contactAddress
      : (abbreviations.address(contactAddress, 4, 10) as string);
    contactColor = getRandomColor();
  }

  const isOutgoing = from?.toLowerCase() === accountAddress?.toLowerCase();
  const canBeResubmitted = isOutgoing && !minedAt;
  const canBeCancelled =
    canBeResubmitted && status !== TransactionStatusTypes.cancelling;
  const blockExplorerAction = lang.t('wallet.action.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
  });

  if (hash) {
    const buttons = [
      ...(isRetryButtonVisible ? [TransactionActions.trySwapAgain] : []),
      ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
      ...(canBeCancelled ? [TransactionActions.cancel] : []),
      blockExplorerAction,
      ...(ios ? [TransactionActions.close] : []),
    ];
    if (showContactInfo) {
      buttons.unshift(
        contact
          ? TransactionActions.viewContact
          : TransactionActions.addToContacts
      );
    }

    showActionSheetWithOptions(
      {
        cancelButtonIndex: buttons.length - 1,
        options: buttons,
        title: pending
          ? `${headerInfo.type}${
              showContactInfo
                ? ' ' + headerInfo.divider + ' ' + headerInfo.address
                : ''
            }`
          : showContactInfo
          ? `${headerInfo.type} ${date} ${headerInfo.divider} ${headerInfo.address}`
          : `${headerInfo.type} ${date}`,
      },
      (buttonIndex: number) => {
        const action = buttons[buttonIndex];
        const actionId = getShortTransactionActionId(action);
        analytics.track('Tapped Transaction Details Menu Item', {
          action: actionId,
        });
        switch (action) {
          case TransactionActions.trySwapAgain:
            Navigation.handleAction(Routes.WALLET_SCREEN, {});
            Navigation.handleAction(Routes.EXCHANGE_MODAL, {
              params: {
                meta: parsedMeta,
                inputAsset: parsedMeta?.inputAsset,
                outputAsset: parsedMeta?.outputAsset,
              },
            });
            break;
          case TransactionActions.viewContact:
          case TransactionActions.addToContacts:
            Navigation.handleAction(Routes.MODAL_SCREEN, {
              address: contactAddress,
              asset: transactionDetails,
              color: contactColor,
              contact,
              type: 'contact_profile',
            });
            break;
          case TransactionActions.speedUp:
            Navigation.handleAction(Routes.SPEED_UP_AND_CANCEL_SHEET, {
              tx: transactionDetails,
              type: 'speed_up',
            });
            break;
          case TransactionActions.close:
            return;
          case TransactionActions.cancel:
            Navigation.handleAction(Routes.SPEED_UP_AND_CANCEL_SHEET, {
              tx: transactionDetails,
              type: 'cancel',
            });
            break;
          case blockExplorerAction:
            ethereumUtils.openTransactionInBlockExplorer(hash, network);
            break;
          default: {
            return;
          }
        }
      }
    );
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

export const getTransactionFlashbotStatus = async (
  transaction: RainbowTransaction,
  txHash: string
) => {
  try {
    const fbStatus = await flashbotsApi.get(`/${txHash}`);
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
    const socketStatus = await rainbowSwapsApi.get('/bridge-status', {
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
