import { includes, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import transactionTypes from '../../helpers/transactionTypes';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { Row } from '../layout';
import Spinner from '../Spinner';
import { Text } from '../text';

const StatusProps = {
  [TransactionStatusTypes.failed]: {
    marginRight: 4,
    name: 'closeCircled',
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.received]: {
    marginRight: 2,
    name: 'arrow',
  },
  [TransactionStatusTypes.self]: {
    marginRight: 4,
    name: 'dot',
  },
  [TransactionStatusTypes.sent]: {
    marginRight: 3,
    name: 'sendSmall',
  },
  [TransactionStatusTypes.swapped]: {
    marginRight: 3,
    name: 'swap',
    small: true,
    style: position.maxSizeAsObject(12),
  },
};

const TransactionStatusBadge = ({ pending, status, type, ...props }) => {
  const isTrade = type === transactionTypes.trade;

  let statusColor = colors.alpha(colors.blueGreyDark, 0.7);
  if (pending) {
    statusColor = colors.appleBlue;
  } else if (isTrade && status === TransactionStatusTypes.sent) {
    statusColor = colors.swapPurple;
  }

  const displayStatus =
    isTrade && status === TransactionStatusTypes.sent
      ? TransactionStatusTypes.swapped
      : status;

  return (
    <Row align="center" {...props}>
      {pending && <Spinner color={colors.appleBlue} size={12} />}
      {displayStatus && includes(Object.keys(StatusProps), displayStatus) && (
        <Icon
          color={statusColor}
          style={position.maxSizeAsObject(10)}
          {...StatusProps[displayStatus]}
        />
      )}
      <Text color={statusColor} size="smedium" weight="semibold">
        {upperFirst(displayStatus)}
      </Text>
    </Row>
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
