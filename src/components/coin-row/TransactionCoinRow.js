import { get } from 'lodash';
import React, { Fragment } from 'react';
import { compose, mapProps, onlyUpdateForKeys } from 'recompact';
import { TransactionStatusTypes } from '../../helpers/transactions';
import { colors } from '../../styles';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const TransactionCoinRow = ({ accountAddress, item, ...props }) => (
  <CoinRow
    {...item}
    {...props}
    bottomRowRender={({ name, native, status }) => {
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
            {nativeDisplay || '$0.00'}
          </BalanceText>
        </Fragment>
      );
    }}
    topRowRender={({ balance, status, ...tx }) => (
      <Fragment>
        <TransactionStatusBadge status={status} />
        <BottomRowText>{get(balance, 'display')}</BottomRowText>
      </Fragment>
    )}
  />
);

export default compose(
  mapProps(({ item: { hash, pending, ...item }, ...props }) => ({
    hash,
    item,
    pending,
    ...props,
  })),
  onlyUpdateForKeys(['hash', 'pending']),
)(TransactionCoinRow);
