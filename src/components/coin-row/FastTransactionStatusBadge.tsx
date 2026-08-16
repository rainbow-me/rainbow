import React, { type JSX } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text, useForegroundColor } from '@/design-system';
import { TransactionStatus, type RainbowTransaction, type TransactionType } from '@/entities/transactions';
import * as i18n from '@/languages';
import { type ThemeContextProps } from '@/theme/ThemeContext';

import Spinner from '../Spinner';

const activityTypeIcon: Record<TransactionType, string> = {
  airdrop: '􀐚',
  approve: '􀁢',
  contract_interaction: '􀉆',
  receive: '􀄩',
  send: '􀈟',
  swap: '􀖅',
  bid: '􀑍',
  burn: '􀙬',
  mint: '􀫸',
  purchase: '􀍣',
  sale: '􀋡',
  wrap: '􀑉',
  unwrap: '􀑉',
  cancel: '􀁠',
  repay: '􀄹',
  bridge: '􀄹',
  stake: '􀄷',
  unstake: '􀄲',
  withdraw: '􀄲',
  deposit: '􀄷',
  delegate: '􀁢',
  revoke: '􀁎',
  revoke_delegation: '􀁎',
  speed_up: '􀓎',
  claim: '􀄩',
  borrow: '􀄩',
  deployment: '􀄩',
  launch: '􀓎',
};

function getIconTopMargin(type: TransactionType): number {
  switch (type) {
    case 'swap':
      return 1;
    case 'mint':
      return -1;
    default:
      return 0;
  }
}

function ActivityTypeIcon({
  transaction: { status, type },
  color,
}: {
  transaction: Pick<RainbowTransaction, 'status' | 'type'>;
  color: string;
}): JSX.Element | null {
  if (status === TransactionStatus.pending) {
    return <Spinner color={color} size={11} style={{ marginTop: -1, paddingRight: 2 }} />;
  }

  if (status === 'failed') {
    return (
      <Text color={{ custom: color }} weight="semibold" size="12pt" align="center">
        {'􀀲'}
      </Text>
    );
  }

  const symbol = activityTypeIcon[type];
  if (!symbol) return null;
  return (
    <View style={{ marginTop: getIconTopMargin(type) }}>
      <Text color={{ custom: color }} weight="semibold" size="12pt">
        {symbol}
      </Text>
    </View>
  );
}

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
        {i18n.t(i18n.l.transactions.type[transaction?.title])}{' '}
      </Text>
    </View>
  );
});
