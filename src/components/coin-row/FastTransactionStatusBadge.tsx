import React, { useCallback } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text, useForegroundColor } from '@/design-system';
import { RainbowTransaction, TransactionStatus } from '@/entities';
import { ThemeContextProps } from '@/theme';
import * as lang from '@/languages';
import { ActivityTypeIcon } from './FastTransactionCoinRow';

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
  let statusColor = useForegroundColor('labelTertiary');
  if (transaction?.status === TransactionStatus.pending) {
    statusColor = colors.appleBlue;
  } else if (transaction?.status === 'failed') {
    statusColor = colors.red;
  }

  return (
    <View style={[sx.row, style]}>
      <View style={sx.icon}>
        <ActivityTypeIcon transaction={transaction} color={statusColor} />
      </View>
      <Text color={{ custom: statusColor }} size="14px / 19px (Deprecated)" weight="semibold">
        {/* @ts-expect-error - some of these are dot.notation and some are strings */}
        {lang.t(lang.l.transactions.type[transaction?.title])}{' '}
      </Text>
    </View>
  );
});
