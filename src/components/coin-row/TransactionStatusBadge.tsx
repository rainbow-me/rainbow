import { includes } from 'lodash';
import React from 'react';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Spinner' was resolved to '/Users/nickby... Remove this comment to see the full error message
import Spinner from '../Spinner';
import { Icon } from '../icons';
import { Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { TransactionStatusTypes } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { magicMemo } from '@rainbow-me/utils';

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

const TransactionStatusBadge = ({ pending, status, style, title }: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Row align="center" style={style}>
      {pending && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Spinner
          color={isSwapping ? colors.swapPurple : colors.appleBlue}
          size={12}
        />
      )}
      {status && includes(Object.keys(StatusProps), status) && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Icon
          color={statusColor}
          style={position.maxSizeAsObject(10)}
          {...StatusProps[status]}
        />
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
