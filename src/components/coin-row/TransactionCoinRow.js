import { compact, get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { compose, mapProps, onlyUpdateForKeys, withHandlers } from 'recompact';
import { Linking } from 'react-native';
import { withNavigation } from 'react-navigation';
import { css } from 'styled-components/primitives';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors } from '../../styles';
import { abbreviations } from '../../utils';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row, RowWithMargins } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const containerStyles = css`
  padding-left: 15;
`;

const rowRenderPropTypes = {
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const BottomRow = ({ name, native, status }) => {
  const isFailed = status === TransactionStatusTypes.failed;
  const isReceived = status === TransactionStatusTypes.received;
  const isSent = status === TransactionStatusTypes.sent;

  let balanceTextColor = colors.blueGreyLight;
  if (isReceived) balanceTextColor = colors.limeGreen;
  if (isSent) balanceTextColor = colors.blueGreyDark;

  const nativeDisplay = get(native, 'display');
  const balanceText = nativeDisplay
    ? compact([isFailed || isSent ? '-' : null, nativeDisplay]).join(' ')
    : '';

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText color={balanceTextColor}>{balanceText}</BalanceText>
      </FlexItem>
    </Row>
  );
};

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ balance, pending, status }) => (
  <RowWithMargins align="center" justify="space-between" margin={19}>
    <TransactionStatusBadge pending={pending} status={status} />
    <Row align="center" flex={1} justify="end">
      <BottomRowText>{get(balance, 'display', '')}</BottomRowText>
    </Row>
  </RowWithMargins>
);

TopRow.propTypes = rowRenderPropTypes;

const TransactionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.98}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      containerStyles={containerStyles}
      shouldRasterizeIOS
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

TransactionCoinRow.propTypes = rowRenderPropTypes;

export default compose(
  mapProps(
    ({ item: { contact, hash, native, pending, ...item }, ...props }) => ({
      contact,
      hash,
      item,
      native,
      pending,
      ...props,
    })
  ),
  withNavigation,
  withHandlers({
    onPressTransaction: ({ contact, hash, item, navigation }) => async () => {
      const { from, to, status } = item;
      const isSent = status === TransactionStatusTypes.sent;
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
        headerInfo.address = abbreviations.address(contactAddress, 4, 10);
        contactColor = Math.floor(Math.random() * colors.avatarColor.length);
      }

      if (hash) {
        showActionSheetWithOptions(
          {
            cancelButtonIndex: 2,
            options: [
              contact ? 'View Contact' : 'Add to Contacts',
              'View on Etherscan',
              'Cancel',
            ],
            title: `${headerInfo.type} ${headerInfo.divider} ${headerInfo.address}`,
          },
          buttonIndex => {
            if (buttonIndex === 0) {
              navigation.navigate('ExpandedAssetScreen', {
                address: contactAddress,
                asset: item,
                color: contactColor,
                contact,
                type: 'contact',
              });
            } else if (buttonIndex === 1) {
              const normalizedHash = hash.replace(/-.*/g, '');
              Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
            }
          }
        );
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'native', 'pending'])
)(TransactionCoinRow);
