import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { Fragment } from 'react';
import { compose, mapProps, onlyUpdateForKeys } from 'recompact';
import { TransactionStatusTypes } from '../../helpers/transactions';
import { colors } from '../../styles';
import BalanceText from './BalanceText';
import BottomRowText from './BottomRowText';
import CoinName from './CoinName';
import CoinRow from './CoinRow';
import TransactionStatusBadge from './TransactionStatusBadge';

const rowRenderPropTypes = {
  balance: PropTypes.object,
  name: PropTypes.string,
  native: PropTypes.object,
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
        {nativeDisplay || '$0.00'}
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

const TransactionCoinRow = ({ item, ...props }) => (
  <CoinRow
    {...item}
    {...props}
    shouldRasterizeIOS={true}
    bottomRowRender={bottomRowRender}
    topRowRender={topRowRender}
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
