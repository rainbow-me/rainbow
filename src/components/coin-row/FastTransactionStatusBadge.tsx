import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useForegroundColor } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { ThemeContextProps } from '@/theme';
import * as lang from '@/languages';
import { ActivityTypeIcon } from './FastTransactionCoinRow';
import { useSuperTokenStore } from '@/screens/token-launcher/state/rainbowSuperTokenStore';

const sx = StyleSheet.create({
  icon: {
    marginRight: 2,
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
  const rainbowSuperToken = useSuperTokenStore(state => state.getSuperTokenByTransactionHash(transaction.hash));
  let statusColor = useForegroundColor('labelTertiary');
  // @ts-expect-error - some of these are dot.notation and some are strings
  let actionTitle = lang.t(lang.l.transactions.type[transaction?.title]);
  if (transaction?.status === TransactionStatus.pending) {
    statusColor = colors.appleBlue;
  } else if (transaction?.status === 'failed') {
    statusColor = colors.red;
  }

  if (rainbowSuperToken) {
    switch (transaction?.status) {
      case TransactionStatus.pending:
        actionTitle = lang.t(lang.l.transactions.type.launch.pending);
        break;
      case TransactionStatus.confirmed:
        actionTitle = lang.t(lang.l.transactions.type.launch.confirmed);
        break;
      case TransactionStatus.failed:
        actionTitle = lang.t(lang.l.transactions.type.launch.failed);
        break;
    }
  }

  return (
    <View style={[sx.row, style]}>
      <View style={sx.icon}>
        <ActivityTypeIcon transaction={transaction} color={statusColor} />
      </View>
      <Text color={{ custom: statusColor }} size="14px / 19px (Deprecated)" weight="semibold">
        {actionTitle}
      </Text>
    </View>
  );
});
