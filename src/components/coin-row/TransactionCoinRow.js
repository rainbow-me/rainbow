import { compact, get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
} from 'recompact';
import { Linking } from 'react-native';
import { css } from 'styled-components/primitives';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors } from '../../styles';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row, RowWithMargins } from '../layout';
import BottomRowText from './BottomRowText';
import BalanceText from './BalanceText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { withNavigation } from 'react-navigation';
import { abbreviations } from '../../utils';
import { getSelectedLocalContact, getNumberOfLocalContacts } from '../../handlers/commonStorage';

// XXX after rebase, not sure if still needed
const containerStyles = css`
  paddingLeft: 15;
`;

const rowRenderPropTypes = {
  balance: PropTypes.object,
  item: PropTypes.object,
  name: PropTypes.string,
  native: PropTypes.object,
  onPressTransaction: PropTypes.func,
  pending: PropTypes.bool,
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
    ? compact([(isFailed || isSent) ? '-' : null, nativeDisplay]).join(' ')
    : '';

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText color={balanceTextColor}>
          {balanceText}
        </BalanceText>
      </FlexItem>
    </Row>
  );
};

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ balance, pending, status }) => (
  <RowWithMargins
    align="center"
    justify="space-between"
    margin={19}
  >
    <TransactionStatusBadge
      pending={pending}
      status={status}
    />
    <Row align="center" flex={1} justify="end">
      <BottomRowText>
        {get(balance, 'display', '')}
      </BottomRowText>
    </Row>
  </RowWithMargins>
);

TopRow.propTypes = rowRenderPropTypes;

const TransactionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
      containerStyles={containerStyles}
      shouldRasterizeIOS={true}
      topRowRender={TopRow}
    />
  </ButtonPressAnimation>
);

TransactionCoinRow.propTypes = rowRenderPropTypes;

export default compose(
  mapProps(({
    item: {
      hash,
      native,
      pending,
      ...item
    },
    ...props
  }) => ({
    hash,
    item,
    native,
    pending,
    ...props,
  })),
  withNavigation,
  withHandlers({
    onPressTransaction: ({ hash, item, navigation }) => async () => {
      let headerInfo = {
        type: "",
        divider: "",
        address: "",
      }
      headerInfo.type = item.status.charAt(0).toUpperCase() + item.status.slice(1);
      headerInfo.divider = item.status === "sent" ? "to" : "from";

      const contactAddressNumber = item.status === "sent" ? item.to : item.from;
      const contact = await getSelectedLocalContact(contactAddressNumber);
      const contactsAmount = await getNumberOfLocalContacts();
      let contactColor = 0;

      if (contact) {
        headerInfo.address = contact.nickname;
        contactColor = contact.color;
      } else {
        headerInfo.address = abbreviations.address(contactAddressNumber, 4, 10);
        contactColor = contactsAmount % 8;
      }

      if (hash) {
        showActionSheetWithOptions({
          title: `${headerInfo.type} ${headerInfo.divider} ${headerInfo.address}`,
          cancelButtonIndex: 2,
          options: [contact ? 'View Contact' : 'Add to Contacts', 'View on Etherscan', 'Cancel'],
        }, (buttonIndex) => {
          if (buttonIndex === 0) {
            navigation.navigate('ExpandedAssetScreen', {
              address: contactAddressNumber,
              color: contactColor,
              asset: item,
              contact: contact,
              type: 'contact',
            });
          } else if (buttonIndex === 1) {
            const normalizedHash = hash.replace(/-.*/g, '');
            Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
          }
        });
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'native', 'pending']),
)(TransactionCoinRow);
