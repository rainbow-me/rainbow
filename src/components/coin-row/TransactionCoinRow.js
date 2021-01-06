import { compact, get, toLower } from 'lodash';
import React, { useCallback } from 'react';
import { Linking } from 'react-native';
import { css } from 'styled-components/primitives';
import TransactionActions from '../../helpers/transactionActions';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import {
  getHumanReadableDate,
  hasAddableContact,
} from '../../helpers/transactions';
import { isENSAddressFormat } from '../../helpers/validators';
import { useAccountSettings } from '../../hooks';
import { useNavigation } from '../../navigation/Navigation';
import { ButtonPressAnimation } from '../animations';
import { CoinIconSize } from '../coin-icon';
import { FlexItem, Row, RowWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import Routes from '@rainbow-me/routes';
import { colors } from '@rainbow-me/styles';
import {
  abbreviations,
  ethereumUtils,
  showActionSheetWithOptions,
} from '@rainbow-me/utils';

const containerStyles = css`
  padding-left: 19;
`;

const BottomRow = ({ description, native, status, type }) => {
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

  const nativeDisplay = get(native, 'display');
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
      <BottomRowText align="right">{get(balance, 'display', '')}</BottomRowText>
    </Row>
  </RowWithMargins>
);

export default function TransactionCoinRow({ item, ...props }) {
  const { contact } = item;
  const { network, accountAddress } = useAccountSettings();
  const { navigate } = useNavigation();

  const onPressTransaction = useCallback(async () => {
    const { hash, from, minedAt, pending, to, status, type } = item;

    const date = getHumanReadableDate(minedAt);
    const isSent =
      status === TransactionStatusTypes.sending ||
      status === TransactionStatusTypes.sent;
    const showContactInfo = hasAddableContact(status, type);

    const isOutgoing = toLower(from) === toLower(accountAddress);
    const canBeResubmitted = isOutgoing && !minedAt;
    const canBeCancelled =
      canBeResubmitted && status !== TransactionStatusTypes.cancelling;

    const headerInfo = {
      address: '',
      divider: isSent ? 'to' : 'from',
      type: status.charAt(0).toUpperCase() + status.slice(1),
    };

    const contactAddress = isSent ? to : from;
    let contactColor = 0;

    if (contact) {
      headerInfo.address = contact.nickname;
      contactColor = contact.color;
    } else {
      headerInfo.address = isENSAddressFormat(contactAddress)
        ? contactAddress
        : abbreviations.address(contactAddress, 4, 10);
      contactColor = colors.getRandomColor();
    }

    if (hash) {
      let buttons = [
        ...(canBeResubmitted ? [TransactionActions.speedUp] : []),
        ...(canBeCancelled ? [TransactionActions.cancel] : []),
        TransactionActions.viewOnEtherscan,
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
            case TransactionActions.viewOnEtherscan: {
              const normalizedHash = hash.replace(/-.*/g, '');
              const etherscanHost = ethereumUtils.getEtherscanHostFromNetwork(
                network
              );
              Linking.openURL(`https://${etherscanHost}/tx/${normalizedHash}`);
              break;
            }
            default:
          }
        }
      );
    }
  }, [accountAddress, contact, item, navigate, network]);

  return (
    <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
      <CoinRow
        {...item}
        {...props}
        bottomRowRender={BottomRow}
        containerStyles={containerStyles}
        {...(android
          ? {
              contentStyles: {
                height:
                  CoinIconSize +
                  (item.status === TransactionStatusTypes.swapped ? 0 : 14),
              },
            }
          : {})}
        topRowRender={TopRow}
      />
    </ButtonPressAnimation>
  );
}
