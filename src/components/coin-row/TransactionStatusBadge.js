import { includes, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import TransactionTypes from '../../helpers/transactionTypes';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { RowWithMargins } from '../layout';
import Spinner from '../Spinner';
import { Text } from '../text';

const StatusProps = {
  [TransactionStatusTypes.deposited]: {
    name: 'sunflower',
    style: { fontSize: 12 },
  },
  [TransactionStatusTypes.withdrew]: {
    name: 'sunflower',
    style: { fontSize: 12 },
  },
  [TransactionStatusTypes.approved]: {
    name: 'dot',
  },
  [TransactionStatusTypes.failed]: {
    name: 'closeCircled',
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.received]: {
    name: 'arrow',
  },
  [TransactionStatusTypes.self]: {
    name: 'dot',
  },
  [TransactionStatusTypes.sent]: {
    name: 'sendSmall',
  },
  [TransactionStatusTypes.swapped]: {
    name: 'swap',
    small: true,
    style: position.maxSizeAsObject(12),
  },
};

const getCustomDisplayStatus = status => {
  switch (status) {
    case TransactionStatusTypes.deposited:
    case TransactionStatusTypes.withdrew:
      return 'Savings';
    default:
      return upperFirst(status);
  }
};

const TransactionStatusBadge = ({ pending, status, type, ...props }) => {
  const isTrade = type === TransactionTypes.trade;

  let statusColor = colors.blueGreyMediumLight;
  if (pending) {
    statusColor = colors.primaryBlue;
  } else if (isTrade && status === TransactionStatusTypes.received) {
    statusColor = colors.dodgerBlue;
  }

  let displayStatus =
    isTrade && status === TransactionStatusTypes.sent
      ? TransactionStatusTypes.swapped
      : status;

  if (
    pending &&
    status === TransactionStatusTypes.sending &&
    type === TransactionTypes.deposit
  ) {
    displayStatus = TransactionStatusTypes.depositing;
  } else if (
    pending &&
    status === TransactionStatusTypes.sending &&
    type === TransactionTypes.withdraw
  ) {
    displayStatus = TransactionStatusTypes.withdrawing;
  }

  return (
    <RowWithMargins
      align="center"
      margin={4}
      opacity={displayStatus === TransactionStatusTypes.swapped ? 0.7 : 1}
      {...props}
    >
      {pending && <Spinner color={colors.appleBlue} size={12} />}
      {displayStatus && includes(Object.keys(StatusProps), displayStatus) && (
        <Icon
          color={statusColor}
          style={position.maxSizeAsObject(10)}
          {...StatusProps[displayStatus]}
        />
      )}
      <Text color={statusColor} size="smedium" weight="semibold">
        {getCustomDisplayStatus(displayStatus)}
      </Text>
    </RowWithMargins>
  );
};

TransactionStatusBadge.propTypes = {
  pending: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
  type: PropTypes.oneOf(Object.values(TransactionTypes)),
};

TransactionStatusBadge.defaultProps = {
  status: TransactionStatusTypes.error,
};

export default onlyUpdateForPropTypes(TransactionStatusBadge);
