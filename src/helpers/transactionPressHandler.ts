import lang from 'i18n-js';
import { getHumanReadableDate, hasAddableContact } from './transactions';
import { isValidDomainFormat } from './validators';
import { TransactionStatusTypes } from '@rainbow-me/entities';
import TransactionActions from '@rainbow-me/helpers/transactionActions';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const startCase = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

type MenuType = {
  buttons: string[];
  title: string;
};

type Navigate = ReturnType<typeof useNavigation>['navigate'];

type Action = keyof typeof TransactionActions;

export const getMenuItems = (item: any) => {
  const {
    accountAddress,
    contact,
    from,
    hash,
    minedAt,
    pending,
    to,
    status,
    type,
    network,
  } = item;

  const date = getHumanReadableDate(minedAt);
  const isSent =
    status === TransactionStatusTypes.sending ||
    status === TransactionStatusTypes.sent;
  const showContactInfo = hasAddableContact(status, type);

  const isOutgoing = from?.toLowerCase() === accountAddress?.toLowerCase();
  const canBeResubmitted = isOutgoing && !minedAt;
  const canBeCancelled =
    canBeResubmitted && status !== TransactionStatusTypes.cancelling;

  const headerInfo = {
    address: '',
    divider: isSent
      ? lang.t('exchange.coin_row.to_divider')
      : lang.t('exchange.coin_row.from_divider'),
    type: status.charAt(0).toUpperCase() + status.slice(1),
  };

  const contactAddress = isSent ? to : from;

  if (contact) {
    headerInfo.address = contact.nickname;
  } else {
    headerInfo.address = isValidDomainFormat(contactAddress)
      ? contactAddress
      : abbreviations.address(contactAddress, 4, 10);
  }

  const blockExplorerAction = lang.t('exchange.coin_row.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
  });

  if (!hash) {
    return {
      buttons: [],
      title: '',
    };
  }

  let buttons = [
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

  let title;
  if (pending) {
    title = `${headerInfo.type}${
      showContactInfo ? ' ' + headerInfo.divider + ' ' + headerInfo.address : ''
    }`;
  } else if (showContactInfo) {
    title = `${headerInfo.type} ${date} ${headerInfo.divider} ${headerInfo.address}`;
  } else {
    title = `${headerInfo.type} ${date}`;
  }

  return { buttons, title };
};

export const getCallback = (navigate: Navigate, item: any) => (
  action: Action
) => {
  const { contact, hash, from, to, status, network } = item;

  const isSent =
    status === TransactionStatusTypes.sending ||
    status === TransactionStatusTypes.sent;

  const headerInfo = {
    address: '',
    divider: isSent
      ? lang.t('exchange.coin_row.to_divider')
      : lang.t('exchange.coin_row.from_divider'),
    type: status.charAt(0).toUpperCase() + status.slice(1),
  };

  const contactAddress = isSent ? to : from;
  let contactColor = 0;

  if (contact) {
    headerInfo.address = contact.nickname;
    contactColor = contact.color;
  } else {
    headerInfo.address = isValidDomainFormat(contactAddress)
      ? contactAddress
      : abbreviations.address(contactAddress, 4, 10);
    contactColor = colors.getRandomColor();
  }

  const blockExplorerAction = lang.t('exchange.coin_row.view_on', {
    blockExplorerName: startCase(ethereumUtils.getBlockExplorer(network)),
  });

  if (!hash) {
    return;
  }

  switch (action) {
    case TransactionActions.viewContact:
    case TransactionActions.addToContacts:
      navigate(Routes.MODAL_SCREEN, {
        address: contactAddress,
        asset: item,
        color: contactColor,
        contact,
        type: 'contact_profile',
      });
      break;
    case TransactionActions.speedUp:
      navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
        tx: item,
        type: 'speed_up',
      });
      break;
    case TransactionActions.cancel:
      navigate(Routes.SPEED_UP_AND_CANCEL_SHEET, {
        tx: item,
        type: 'cancel',
      });
      break;
    case TransactionActions.close:
      return;
    case blockExplorerAction:
      ethereumUtils.openTransactionInBlockExplorer(hash, network);
      break;
    default: {
      return;
    }
  }
};

export const getOnPressAndroid = (
  menu: MenuType,
  callback: (action: Action) => void
) => (e: any) => {
  const buttonIndex = menu.buttons.findIndex(
    item => item === e.nativeEvent.actionKey
  );
  const action = menu.buttons[buttonIndex] as Action;
  callback(action);
};

export const getOnPressIOS = (
  menu: MenuType,
  callback: (action: Action) => void
) => () => {
  showActionSheetWithOptions(
    {
      cancelButtonIndex: menu.buttons.length - 1,
      options: menu.buttons,
      title: menu.title,
    },
    (buttonIndex: number) => {
      const action = menu.buttons[buttonIndex] as Action;
      callback(action);
    }
  );
};
