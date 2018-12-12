import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, mapProps, onlyUpdateForKeys, withHandlers } from 'recompact';
import { Linking } from 'react-native';
import { ButtonPressAnimation } from '../buttons';
import { TransactionStatusTypes } from '../../helpers/transactions';
import { colors } from '../../styles';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';
import { showActionSheetWithOptions } from '../../utils/actionsheet';

const rowRenderPropTypes = {
  balance: PropTypes.object,
  name: PropTypes.string,
  native: PropTypes.object,
  onPressTransaction: PropTypes.func,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const bottomRowRender = ({ name, native, status }) => {
  const nativeDisplay = get(native, 'balance.display');

  const isStatusSent = status === TransactionStatusTypes.sent;
  const isStatusReceived = status === TransactionStatusTypes.received;

  let balanceTextColor = colors.blueGreyLight;
  if (isStatusReceived) balanceTextColor = colors.primaryGreen;
  if (!nativeDisplay) balanceTextColor = null;

  return (
    <Fragment>
      <CoinName>{name}</CoinName>
      <BalanceText color={balanceTextColor}>
        {(nativeDisplay && isStatusSent) ? '- ' : ''}
        {nativeDisplay || ''}
      </BalanceText>
    </Fragment>
  );
};

bottomRowRender.propTypes = rowRenderPropTypes;

const topRowRender = ({ balance, status }) => (
  <Fragment>
    <TransactionStatusBadge status={status} />
    <BottomRowText>{get(balance, 'display')}</BottomRowText>
  </Fragment>
);

topRowRender.propTypes = rowRenderPropTypes;

const TransactionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      shouldRasterizeIOS={true}
      bottomRowRender={bottomRowRender}
      topRowRender={topRowRender}
    />
  </ButtonPressAnimation>
);

export default compose(
  mapProps(({ item: { hash, pending, ...item }, ...props }) => ({
    hash,
    item,
    pending,
    ...props,
  })),
  withHandlers({
    onPressTransaction: ({ hash }) => () => {
      if (hash) {
        showActionSheetWithOptions({
          cancelButtonIndex: 1,
          options: ['View on Etherscan', 'Cancel'],
        }, (buttonIndex) => {
          if (buttonIndex === 0) {
            const etherscanUrl = `https://etherscan.io/tx/${hash}`;
            Linking.openURL(etherscanUrl);
          }
        });
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'pending']),
)(TransactionCoinRow);
