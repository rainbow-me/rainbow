import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import {
  compose,
  mapProps,
  onlyUpdateForKeys,
  withHandlers,
} from 'recompact';
import { Linking } from 'react-native';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors } from '../../styles';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import { ButtonPressAnimation } from '../animations';
import { FlexItem, Row } from '../layout';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const rowRenderPropTypes = {
  balance: PropTypes.object,
  item: PropTypes.object,
  name: PropTypes.string,
  native: PropTypes.object,
  onPressTransaction: PropTypes.func,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

const BottomRow = ({ name, native, status }) => {
  const nativeDisplay = get(native, 'balance.display');

  const isStatusSent = status === TransactionStatusTypes.sent;
  const isStatusReceived = status === TransactionStatusTypes.received;

  let balanceTextColor = colors.blueGreyLight;
  if (isStatusReceived) balanceTextColor = colors.primaryGreen;

  return (
    <Row align="center" justify="space-between">
      <FlexItem flex={1}>
        <CoinName>{name}</CoinName>
      </FlexItem>
      <FlexItem flex={0}>
        <BalanceText color={balanceTextColor}>
          {(nativeDisplay && isStatusSent) ? '- ' : ''}
          {nativeDisplay || `${native.symbol}0.00`}
        </BalanceText>
      </FlexItem>
    </Row>
  );
};

BottomRow.propTypes = rowRenderPropTypes;

const TopRow = ({ balance, status }) => (
  <Fragment>
    <TransactionStatusBadge status={status} />
    <BottomRowText>{get(balance, 'display')}</BottomRowText>
  </Fragment>
);

TopRow.propTypes = rowRenderPropTypes;

const TransactionCoinRow = ({ item, onPressTransaction, ...props }) => (
  <ButtonPressAnimation onPress={onPressTransaction} scaleTo={0.96}>
    <CoinRow
      {...item}
      {...props}
      bottomRowRender={BottomRow}
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
  withHandlers({
    onPressTransaction: ({ hash }) => () => {
      if (hash) {
        showActionSheetWithOptions({
          cancelButtonIndex: 1,
          options: ['View on Etherscan', 'Cancel'],
        }, (buttonIndex) => {
          if (buttonIndex === 0) {
            const normalizedHash = hash.replace(/-.*/g, '');
            Linking.openURL(`https://etherscan.io/tx/${normalizedHash}`);
          }
        });
      }
    },
  }),
  onlyUpdateForKeys(['hash', 'native', 'pending']),
)(TransactionCoinRow);
