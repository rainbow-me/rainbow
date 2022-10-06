import { Contract } from '@ethersproject/contracts';
import { isEmpty } from 'lodash';
import { web3Provider } from './web3';
import { metadataClient } from '@/apollo/client';
import { CONTRACT_FUNCTION } from '@/apollo/queries';
import {
  RainbowTransaction,
  TransactionStatusTypes,
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
} from '@/utils';
import { getRandomColor } from '@/styles/colors';
import startCase from 'lodash/startCase';
import TransactionActions from '@/helpers/transactionActions';
import Routes from '@rainbow-me/routes';
import { Navigation } from '@/navigation';
import { Contact } from '@/redux/contacts';
import { NetworkTypes } from '@/helpers';

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
  const { hash, from, minedAt, pending, to, status, type } = transactionDetails;

  // Invariants
  const network = transactionDetails.network ?? NetworkTypes.mainnet;
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

    console.log('----- getOnPressIOS');
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
        switch (action) {
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
