import lang from 'i18n-js';
import { compact, startCase } from 'lodash';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getRandomColor } from '../../styles/colors';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FlexItem, Row, RowWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { TransactionStatusTypes, TransactionTypes } from '@/entities';
import { TransactionActions } from '@/helpers/transactionActions';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '@/helpers/transactions';
import { isValidDomainFormat } from '@/helpers/validators';
import { useAccountSettings } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@/utils';

const containerStyles = {
  paddingLeft: 19,
};

export const TRANSACTION_COIN_ROW_VERTICAL_PADDING = 7;

const contentStyles = android
  ? {
      height: CoinIconSize + TRANSACTION_COIN_ROW_VERTICAL_PADDING * 2,
    }
  : {};

const BottomRow = ({ description, native, status, type }) => {
  const { colors } = useTheme();
  const isFailed = status === TransactionStatusTypes.failed;
  const isReceived =
    status === TransactionStatusTypes.received ||
    status === TransactionStatusTypes.purchased;
  const isSent = status === TransactionStatusTypes.sent;

  const isOutgoingSwap = status === TransactionStatusTypes.swapped;
  const isIncomingSwap =
    status === TransactionStatusTypes.received &&
    type === TransactionTypes.trade;

  let coinNameColor = colors.dark;
  if (isOutgoingSwap) coinNameColor = colors.alpha(colors.blueGreyDark, 0.5);

  let balanceTextColor = colors.alpha(colors.blueGreyDark, 0.5);
  if (isReceived) balanceTextColor = colors.green;
  if (isSent) balanceTextColor = colors.dark;
  if (isIncomingSwap) balanceTextColor = colors.swapPurple;
  if (isOutgoingSwap) balanceTextColor = colors.dark;

  const nativeDisplay = native?.display;
  const balanceText = nativeDisplay
    ? compact([isFailed || isSent ? '-' : null, nativeDisplay]).join(' ')
    : '';

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName color={coinNameColor}>{description}</CoinName>
      </FlexItem>
      <BalanceText
        color={balanceTextColor}
        weight={isReceived ? 'medium' : null}
      >
        {balanceText}
      </BalanceText>
    </Row>
  );
};

const TopRow = ({ balance, pending, status, title }) => (
  <RowWithMargins align="center" justify="space-between" margin={19}>
    <TransactionStatusBadge pending={pending} status={status} title={title} />
    <Row align="center" flex={1} justify="end">
      <BottomRowText align="right">{balance?.display ?? ''}</BottomRowText>
    </Row>
  </RowWithMargins>
);

export default function TransactionCoinRow({ item, ...props }) {
  const { contact } = item;
  const { accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();

  const onPressTransaction = useCallback(async () => {
    const { hash, from, minedAt, pending, to, status, type, network } = item;

    const date = getHumanReadableDate(minedAt);
    const isSent =
      status === TransactionStatusTypes.sending ||
      status === TransactionStatusTypes.sent;
    const showContactInfo = hasAddableContact(status, type);

    const isOutgoing = from?.toLowerCase() === accountAddress.toLowerCase();
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
    let contactColor = 0;

    if (contact) {
      headerInfo.address = contact.nickname;
      contactColor = contact.color;
    } else {
      headerInfo.address = isValidDomainFormat(contactAddress)
        ? contactAddress
        : abbreviations.address(contactAddress, 4, 10);
      contactColor = getRandomColor();
    }

    const blockExplorerAction = lang.t('exchange.coin_row.view_on', {
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
        buttonIndex => {
          const action = buttons[buttonIndex];
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
        }
      );
    }
  }, [accountAddress, contact, item, navigate]);

  const mainnetAddress = useSelector(
    state =>
      state.data.accountAssetsData?.[`${item.address}_${item.network}`]
        ?.mainnet_address
  );

  return (
    <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
      <CoinRow
        {...item}
        {...props}
        address={mainnetAddress || item.address}
        bottomRowRender={BottomRow}
        containerStyles={containerStyles}
        contentStyles={contentStyles}
        testID={`${item.status[0].toUpperCase() + item.status.substring(1)}-${
          item.name
        }`}
        topRowRender={TopRow}
        type={item.network}
      />
    </ButtonPressAnimation>
  );
}
