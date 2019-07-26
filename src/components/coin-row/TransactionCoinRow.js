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
