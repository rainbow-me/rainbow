import { includes, upperFirst } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { onlyUpdateForPropTypes } from 'recompact';
import TransactionStatusTypes from '../../helpers/transactionStatusTypes';
import { colors, position } from '../../styles';
import Icon from '../icons/Icon';
import { RowWithMargins } from '../layout';
import Spinner from '../Spinner';
import { Text } from '../text';
import transactionTypes from '../../helpers/transactionTypes';

const StatusProps = {
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
    name: 'smallSwap',
    style: position.maxSizeAsObject(12),
  },
};

const TransactionStatusBadge = ({ pending, status, type, ...props }) => {
  const statusColor = pending ? colors.primaryBlue : colors.blueGreyMediumLight;

  let displayStatus =
    type === transactionTypes.trade && status === TransactionStatusTypes.sent
      ? TransactionStatusTypes.swapped
      : status;

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
        {upperFirst(displayStatus)}
      </Text>
    </RowWithMargins>
  );
};

TransactionStatusBadge.propTypes = {
  pending: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(TransactionStatusTypes)),
};

TransactionStatusBadge.defaultProps = {
  status: TransactionStatusTypes.error,
};

export default onlyUpdateForPropTypes(TransactionStatusBadge);
