import { includes, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import transactionTypes from '../../helpers/transactionTypes';
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

const getRealDisplayStatus = status => {
  switch (status) {
    case TransactionStatusTypes.deposited:
    case TransactionStatusTypes.withdrew:
      return 'Savings';
    default:
      return upperFirst(status);
  }
};

const TransactionStatusBadge = ({ pending, status, type, ...props }) => {
  const isTrade = type === transactionTypes.trade;

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
    type === transactionTypes.deposit
  ) {
    displayStatus = 'Depositing';
  } else if (
    pending &&
    status === TransactionStatusTypes.sending &&
    type === transactionTypes.withdraw
  ) {
    displayStatus = 'Withdrawing';
  }

  // Backwards compatibility
  if (!status && !displayStatus) {
    if (type === 'withdraw') {
      displayStatus = TransactionStatusTypes.withdrew;
    } else if (type === 'deposit') {
      displayStatus = TransactionStatusTypes.deposited;
    }
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
        {getRealDisplayStatus(displayStatus)}
      </Text>
    </RowWithMargins>
  );
};

TransactionStatusBadge.propTypes = {
  pending: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
  type: PropTypes.oneOf(Object.values(transactionTypes)),
};

TransactionStatusBadge.defaultProps = {
  status: TransactionStatusTypes.error,
};

export default onlyUpdateForPropTypes(TransactionStatusBadge);
