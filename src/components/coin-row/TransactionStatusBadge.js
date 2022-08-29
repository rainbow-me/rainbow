import React from 'react';
import Spinner from '../Spinner';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';
import { TransactionStatusTypes } from '@/entities';
import { position } from '@/styles';
import { magicMemo } from '@/utils';

const StatusProps = {
  [TransactionStatusTypes.approved]: {
    marginRight: 4,
    name: 'dot',
  },
  [TransactionStatusTypes.cancelled]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.cancelling]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.deposited]: {
    name: 'sunflower',
    style: { fontSize: 11, left: -1.3, marginBottom: 1.5, marginRight: 1 },
  },
  [TransactionStatusTypes.depositing]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.approving]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.swapping]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.speeding_up]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.dropped]: {
    marginRight: 4,
    name: 'closeCircled',
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.failed]: {
    marginRight: 4,
    name: 'closeCircled',
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.purchased]: {
    marginRight: 2,
    name: 'arrow',
  },
  [TransactionStatusTypes.purchasing]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.received]: {
    marginRight: 2,
    name: 'arrow',
  },
  [TransactionStatusTypes.self]: {
    marginRight: 4,
    name: 'dot',
  },
  [TransactionStatusTypes.sending]: {
    marginRight: 4,
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
  [TransactionStatusTypes.contract_interaction]: {
    name: 'robot',
    style: { fontSize: 11, left: -1.3, marginBottom: 1.5, marginRight: 1 },
  },
  [TransactionStatusTypes.swapping]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.withdrawing]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.withdrew]: {
    name: 'sunflower',
    style: { fontSize: 11, left: -1.3, marginBottom: 1.5, marginRight: 1 },
  },
};

const TransactionStatusBadge = ({ pending, status, style, title }) => {
  const { colors } = useTheme();
  const isSwapping = status === TransactionStatusTypes.swapping;

  let statusColor = colors.alpha(colors.blueGreyDark, 0.7);
  if (pending) {
    if (isSwapping) {
      statusColor = colors.swapPurple;
    } else {
      statusColor = colors.appleBlue;
    }
  } else if (status === TransactionStatusTypes.swapped) {
    statusColor = colors.swapPurple;
  }

  return (
    <Row align="center" style={style}>
      {pending && (
        <Spinner
          color={isSwapping ? colors.swapPurple : colors.appleBlue}
          size={12}
        />
      )}
      {status && Object.keys(StatusProps).includes(status) && (
        <Icon
          color={statusColor}
          style={position.maxSizeAsObject(10)}
          {...StatusProps[status]}
        />
      )}
      <Text color={statusColor} size="smedium" weight="semibold">
        {title}
      </Text>
    </Row>
  );
};

export default magicMemo(TransactionStatusBadge, [
  'pending',
  'status',
  'title',
]);
