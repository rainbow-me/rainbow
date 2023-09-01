import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Spinner from '../Spinner';
import { Icon } from '../icons';
import { Text } from '@/design-system';
import { TransactionStatus, TransactionStatusTypes } from '@/entities';
import { position } from '@/styles';
import { ThemeContextProps } from '@/theme';
import * as lang from '@/languages';

const StatusProps = {
  [TransactionStatusTypes.approved]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
    name: 'dot',
  },
  [TransactionStatusTypes.cancelled]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.cancelling]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.deposited]: {
    name: 'sunflower',
    style: {
      fontSize: 11,
      left: -1.3,
      marginRight: 1,
      marginTop: ios ? -3 : -5,
    },
  },
  [TransactionStatusTypes.depositing]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.approving]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.swapping]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.selling]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.speeding_up]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.failed]: {
    marginRight: 4,
    marginTop: ios ? -1 : -2,
    name: 'closeCircled',
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.purchased]: {
    marginRight: 2,
    marginTop: ios ? 0 : -1,
    name: 'arrow',
  },
  [TransactionStatusTypes.purchasing]: {
    marginRight: 4,
    marginTop: ios ? 0 : -1,
  },
  [TransactionStatusTypes.received]: {
    marginRight: 2,
    marginTop: ios ? 0 : -1,
    name: 'arrow',
  },
  [TransactionStatusTypes.self]: {
    marginRight: 4,
    marginTop: ios ? 0 : -1,
    name: 'dot',
  },
  [TransactionStatusTypes.sending]: {
    marginRight: 4,
    marginTop: ios ? 0 : -1,
  },
  [TransactionStatusTypes.sent]: {
    marginRight: 3,
    marginTop: ios ? 0 : -1,
    name: 'sendSmall',
  },
  [TransactionStatusTypes.swapped]: {
    marginRight: 3,
    marginTop: ios ? -1 : -2,
    name: 'swap',
    small: true,
    style: position.maxSizeAsObject(12),
  },
  [TransactionStatusTypes.contract_interaction]: {
    name: 'robot',
    style: {
      fontSize: 11,
      left: -1.3,
      marginRight: 1,
      marginTop: ios ? -3 : -5,
    },
  },
  [TransactionStatusTypes.bridged]: {
    name: 'bridge',
    style: {
      left: -0.9,
      marginTop: -2.5,
      marginBottom: -4,
      marginRight: 0,
    },
  },
  [TransactionStatusTypes.bridging]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
  },
  [TransactionStatusTypes.withdrawing]: {
    marginRight: 4,
  },
  [TransactionStatusTypes.withdrew]: {
    name: 'sunflower',
    style: {
      fontSize: 11,
      left: -1.3,
      marginRight: 1,
      marginTop: ios ? -3 : -5,
    },
  },
  [TransactionStatusTypes.sold]: {
    name: 'sunflower',
    style: {
      fontSize: 11,
      left: -1.3,
      marginRight: 1,
      marginTop: ios ? -3 : -5,
    },
  },
};

const sx = StyleSheet.create({
  icon: {
    ...position.maxSizeAsObject(10),
  },
  row: {
    flexDirection: 'row',
  },
});

export default React.memo(function FastTransactionStatusBadge({
  pending,
  status,
  style,
  title,
  colors,
}: {
  colors: ThemeContextProps['colors'];
  pending: boolean;
  status: keyof typeof TransactionStatusTypes;
  title: string;
  style?: StyleProp<ViewStyle>;
}) {
  const isSwapping = status === TransactionStatusTypes.swapping;
  const isBridging = status === TransactionStatusTypes.bridging;

  let statusColor = colors.alpha(colors.blueGreyDark, 0.7);
  if (pending) {
    if (isSwapping || isBridging) {
      statusColor = colors.swapPurple;
    } else {
      statusColor = colors.appleBlue;
    }
  } else if (
    status === TransactionStatusTypes.swapped ||
    status === TransactionStatusTypes.bridged
  ) {
    statusColor = colors.swapPurple;
  }

  const showIcon = !!StatusProps[status];

  return (
    <View style={[sx.row, style]}>
      {pending && (
        <Spinner
          color={statusColor}
          size={12}
          style={{ marginTop: ios ? 0 : -2 }}
        />
      )}
      {showIcon && (
        <Icon color={statusColor} style={sx.icon} {...StatusProps[status]} />
      )}
      <Text
        color={{ custom: statusColor }}
        size="14px / 19px (Deprecated)"
        weight="semibold"
      >
        {/* @ts-expect-error cant get keys*/}
        {lang.t(lang.l.transactions.type[status])}
      </Text>
    </View>
  );
});
