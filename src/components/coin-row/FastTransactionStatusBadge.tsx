import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Spinner from '../Spinner';
import { Icon } from '../icons';
import { Text, useForegroundColor } from '@/design-system';
import {
  RainbowTransaction,
  TransactionStatus,
  TransactionStatusTypes,
} from '@/entities';
import { position } from '@/styles';
import { ThemeContextProps } from '@/theme';
import * as lang from '@/languages';
import { TransactionType } from '@/resources/transactions/types';
import { transactionTypes } from '@/entities/transactions/transactionType';
import { ActivityTypeIcon } from './FastTransactionCoinRow';

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
  [TransactionStatusTypes.minted]: {
    name: 'sunflower',
    style: {
      fontSize: 11,
      left: -1.3,
      marginRight: 1,
      marginTop: ios ? -3 : -5,
    },
  },
  [TransactionStatusTypes.minting]: {
    marginRight: 4,
    marginTop: ios ? 1 : 0,
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
  transaction,
  style,
  colors,
}: {
  transaction: RainbowTransaction;
  colors: ThemeContextProps['colors'];
  style?: StyleProp<ViewStyle>;
}) {
  let statusColor = useForegroundColor('labelTertiary');
  if (transaction?.status === 'pending') {
    statusColor = colors.appleBlue;
  } else if (transaction?.status === 'failed') {
    statusColor = colors.red;
  }

  return (
    <View style={[sx.row, style]}>
      <ActivityTypeIcon transaction={transaction} color={statusColor} />
      <Text
        color={{ custom: statusColor }}
        size="14px / 19px (Deprecated)"
        weight="semibold"
      >
        {/* @ts-ignore */}
        {lang.t(lang.l.transactions.type[transaction?.title])}
      </Text>
    </View>
  );
});
