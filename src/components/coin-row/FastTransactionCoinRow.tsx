import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import FastTransactionStatusBadge from './FastTransactionStatusBadge';
import { Text } from '@rainbow-me/design-system';
import { TransactionStatusTypes, TransactionTypes } from '@rainbow-me/entities';
import { ThemeContextProps } from '@rainbow-me/theme';

const cx = StyleSheet.create({
  balance: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 2,
  },
  bottomRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 3,
  },
  column: {
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 11,
  },
  icon: {
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wholeRow: {
    flexDirection: 'row',
    height: 40,
    justifyContent: 'space-between',
    marginVertical: 17,
    paddingHorizontal: 19,
  },
});

const BottomRow = React.memo(function BottomRow({
  description,
  nativeDisplay,
  status,
  type,
  theme,
}: {
  description: string;
  nativeDisplay: any;
  status: keyof typeof TransactionStatusTypes;
  type: keyof typeof TransactionTypes;
  theme: ThemeContextProps;
}) {
  const { colors } = theme;
  const isFailed = status === TransactionStatusTypes.failed;
  const isReceived =
    status === TransactionStatusTypes.received ||
    status === TransactionStatusTypes.purchased;
  const isSent = status === TransactionStatusTypes.sent;

  const isOutgoingSwap = status === TransactionStatusTypes.swapped;
  const isIncomingSwap =
    status === TransactionStatusTypes.received &&
    type === TransactionTypes.trade;

  let coinNameColor = colors.dark;
  if (isOutgoingSwap) coinNameColor = colors.blueGreyDark50;

  let balanceTextColor = colors.blueGreyDark50;
  if (isReceived) balanceTextColor = colors.green;
  if (isSent) balanceTextColor = colors.dark;
  if (isIncomingSwap) balanceTextColor = colors.swapPurple;
  if (isOutgoingSwap) balanceTextColor = colors.dark;

  const balanceText = nativeDisplay
    ? [isFailed || isSent ? '-' : null, nativeDisplay].filter(Boolean).join(' ')
    : '';

  return (
    <View style={cx.bottomRow}>
      <Text color={{ custom: coinNameColor || colors.dark }} size="16px">
        {description}
      </Text>
      <Text
        align="right"
        color={{ custom: balanceTextColor ?? colors.dark }}
        size="16px"
        weight={isReceived ? 'medium' : undefined}
      >
        {balanceText}
      </Text>
    </View>
  );
});

export default React.memo(function TransactionCoinRow({
  item,
  theme,
  onTransactionPress,
}: {
  item: any;
  theme: ThemeContextProps;
  onTransactionPress: (item: any) => void;
}) {
  const { mainnetAddress } = item;
  const { colors } = theme;
  const handleTransactionPress = useCallback(() => onTransactionPress(item), [
    item,
    onTransactionPress,
  ]);

  return (
    <ButtonPressAnimation onPress={handleTransactionPress} scaleTo={0.96}>
      <View style={cx.wholeRow}>
        <View style={cx.icon}>
          <FastCoinIcon
            address={mainnetAddress || item.address}
            assetType={item.assetType}
            symbol={item.symbol}
            theme={theme}
          />
        </View>
        <View style={cx.column}>
          <View style={cx.topRow}>
            <FastTransactionStatusBadge
              colors={colors}
              pending={item.pending}
              status={item.status}
              title={item.title}
            />
            <View style={cx.balance}>
              <Text
                color={{ custom: colors.balanceText }}
                numberOfLines={1}
                size="14px"
              >
                {item.balance?.display ?? ''}
              </Text>
            </View>
          </View>
          <BottomRow
            description={item.description}
            nativeDisplay={item.native?.display}
            status={item.status}
            theme={theme}
            type={item.type}
          />
        </View>
      </View>
    </ButtonPressAnimation>
  );
});
