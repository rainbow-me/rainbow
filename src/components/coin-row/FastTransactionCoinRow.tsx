import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import FastTransactionStatusBadge from './FastTransactionStatusBadge';
import { Bleed, Box, Inline, Text, globalColors, useForegroundColor } from '@/design-system';
import { NativeCurrencyKey, NewTransaction, RainbowTransaction } from '@/entities';
import { ThemeContextProps } from '@/theme';
import { useNavigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { ImgixImage } from '../images';
import { CardSize } from '../unique-token/CardSize';
import { ChainBadge } from '../coin-icon';
import { Network } from '@/networks/types';
import { address } from '@/utils/abbreviations';
import { TransactionType } from '@/resources/transactions/types';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
  convertRawAmountToBalance,
  convertRawAmountToDecimalFormat,
  greaterThan,
  handleSignificantDecimals,
} from '@/helpers/utilities';
import { TwoCoinsIcon } from '../coin-icon/TwoCoinsIcon';
import Spinner from '../Spinner';
import * as lang from '@/languages';
import RainbowCoinIcon from '../coin-icon/RainbowCoinIcon';
import { checkForPendingSwap } from '@/screens/transaction-details/helpers/checkForPendingSwap';

export const getApprovalLabel = ({ approvalAmount, asset, type }: Pick<RainbowTransaction, 'type' | 'asset' | 'approvalAmount'>) => {
  if (!approvalAmount || !asset) return;
  if (approvalAmount === 'UNLIMITED') return lang.t(lang.l.transactions.approvals.unlimited);
  if (type === 'revoke') return lang.t(lang.l.transactions.approvals.no_allowance);
  const amountDisplay = convertRawAmountToBalance(
    approvalAmount,
    { decimals: asset?.decimals, symbol: asset?.symbol },
    undefined,
    true
  )?.display;
  return amountDisplay || '';
};

const approvalTypeValues = (transaction: RainbowTransaction) => {
  const { asset, approvalAmount } = transaction;

  if (!asset || !approvalAmount) return;
  transaction.protocol;
  return [transaction.protocol || '', getApprovalLabel(transaction)];
};

const swapTypeValues = (changes: RainbowTransaction['changes'], status: RainbowTransaction['status']) => {
  const tokenIn = changes?.filter(c => c?.direction === 'in')[0];
  const tokenOut = changes?.filter(c => c?.direction === 'out')[0];

  // NOTE: For pending txns let's use the change values instead of
  // the transaction balance change since that hasn't happened yet
  if (status === 'pending') {
    const valueOut = `${handleSignificantDecimals(convertRawAmountToDecimalFormat(tokenOut?.value?.toString() || '0', tokenOut?.asset.decimals || 18), tokenOut?.asset.decimals || 18)} ${tokenOut?.asset.symbol}`;
    const valueIn = `+${handleSignificantDecimals(convertRawAmountToDecimalFormat(tokenIn?.value?.toString() || '0', tokenIn?.asset.decimals || 18), tokenIn?.asset.decimals || 18)} ${tokenIn?.asset.symbol}`;

    return [valueOut, valueIn];
  }

  if (!tokenIn?.asset.balance?.amount || !tokenOut?.asset.balance?.amount) return;

  const valueOut = `${convertAmountToBalanceDisplay(tokenOut?.asset.balance?.amount, { ...tokenOut?.asset })}`;
  const valueIn = `+${convertAmountToBalanceDisplay(tokenIn?.asset.balance?.amount, { ...tokenIn?.asset })}`;

  return [valueOut, valueIn];
};

const activityValues = (transaction: RainbowTransaction, nativeCurrency: NativeCurrencyKey) => {
  const { changes, direction, type, status } = transaction;
  if (checkForPendingSwap(transaction)) return swapTypeValues(changes, status);
  if (['approve', 'revoke'].includes(type)) return approvalTypeValues(transaction as RainbowTransaction);

  const change = changes?.filter(c => c?.direction === direction && c?.asset.type !== 'nft')[0];
  let valueSymbol = direction === 'out' ? '-' : '+';

  if (type === 'send') {
    valueSymbol = '-';
  }
  if (type === 'receive') {
    valueSymbol = '+';
  }

  if (!change?.asset) return;

  const { balance } = change.asset;

  const assetValue = convertAmountToBalanceDisplay(balance?.amount || '0', change.asset);

  const nativeBalance = convertAmountAndPriceToNativeDisplay(balance?.amount || '0', change.asset.price?.value || '0', nativeCurrency);
  const assetNativeValue = greaterThan(nativeBalance.amount, '0')
    ? `${valueSymbol}${nativeBalance?.display}`
    : lang.t(lang.l.transactions.no_value);

  return greaterThan(nativeBalance.amount, '0') ? [`${assetValue}`, assetNativeValue] : [assetNativeValue, `${valueSymbol}${assetValue}`];
};
const getIconTopMargin = (type: TransactionType) => {
  switch (type) {
    case 'swap':
      return 1;
    case 'mint':
      return -1;

    default:
      return 0;
  }
};
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
  revoke: '􀁎',
  speed_up: '􀓎',
  claim: '􀄩',
  borrow: '􀄩',
  deployment: '􀄩',
};

export const ActivityTypeIcon = ({
  transaction: { status, type },
  color,
}: {
  transaction: Pick<RainbowTransaction, 'status' | 'type'>;
  color: string;
}) => {
  // if (status === 'pending') return null;
  if (status === 'pending') {
    return <Spinner color={color} size={11} style={{ marginTop: -1, paddingRight: 2 }} />;
  }

  if (status === 'failed')
    return (
      <Text color={{ custom: color }} weight="semibold" size="12pt" align="center">
        {'􀀲'}
      </Text>
    );

  const symbol = activityTypeIcon[type];
  if (!symbol) return null;
  return (
    <View style={{ marginTop: getIconTopMargin(type) }}>
      <Text color={{ custom: color }} weight="semibold" size="12pt">
        {symbol}
      </Text>
    </View>
  );
};

const BottomRow = React.memo(function BottomRow({
  transaction,
  nativeCurrency,
  theme,
}: {
  transaction: RainbowTransaction;
  nativeCurrency: NativeCurrencyKey;
  theme: ThemeContextProps;
}) {
  const { type, to, asset } = transaction;
  const separatorSecondary = useForegroundColor('separatorSecondary');

  let description = transaction.description;
  let tag: string | undefined;
  if (type === 'contract_interaction' && to) {
    description = transaction.contract?.name || address(to, 6, 4);
    tag = transaction.description;
  }

  if (transaction?.type === 'mint') {
    const inAsset = transaction?.changes?.find(a => a?.direction === 'in')?.asset;
    description = inAsset?.name || '';
  }

  if (['wrap', 'unwrap', 'swap'].includes(transaction?.type)) {
    const inAsset = transaction?.changes?.find(a => a?.direction === 'in')?.asset;
    const outAsset = transaction?.changes?.find(a => a?.direction === 'out')?.asset;

    if (!!inAsset && !!outAsset) description = `${outAsset?.symbol} 􀄫 ${inAsset?.symbol}`;
  }

  const nftChangesAmount = transaction.changes
    ?.filter(c => asset?.address === c?.asset.address && c?.asset.type === 'nft')
    .filter(Boolean).length;
  if (nftChangesAmount) tag = nftChangesAmount.toString();

  const [topValue, bottomValue] = activityValues(transaction, nativeCurrency) ?? [];

  return (
    <View style={sx.bottomRow}>
      <View style={sx.description}>
        <Inline wrap={false} horizontalSpace={'6px'}>
          <Text color={'label'} numberOfLines={1} size="16px / 22px (Deprecated)" weight="regular">
            {description}
          </Text>
          {tag && (
            <Bleed vertical={{ custom: 5 }}>
              <Box
                style={{
                  borderWidth: 1.5,
                  borderColor: theme.colors.alpha(separatorSecondary, 0.2),
                  borderRadius: 8,
                }}
                justifyContent="center"
                alignItems="center"
                padding={{ custom: 5 }}
              >
                <Text align="center" color="labelTertiary" size="13pt" weight="regular">
                  {tag}
                </Text>
              </Box>
            </Bleed>
          )}
        </Inline>
      </View>
      <View style={sx.nativeBalance}>
        <Text
          align="right"
          color={bottomValue?.includes('+') ? 'green' : 'labelSecondary'}
          size="16px / 22px (Deprecated)"
          weight={'regular'}
          numberOfLines={1}
        >
          {bottomValue}
        </Text>
      </View>
    </View>
  );
});

export const ActivityIcon = ({
  transaction,
  size = 40,
  badge = true,
  theme,
}: {
  transaction: RainbowTransaction;
  badge?: boolean;
  size?: 40 | 20 | 14 | 16;
  theme: ThemeContextProps;
}) => {
  if (['wrap', 'unwrap', 'swap'].includes(transaction?.type)) {
    const inAsset = transaction?.changes?.find(a => a?.direction === 'in')?.asset;
    const outAsset = transaction?.changes?.find(a => a?.direction === 'out')?.asset;

    if (!!inAsset?.icon_url && !!outAsset?.icon_url) return <TwoCoinsIcon over={inAsset} under={outAsset} badge={badge} />;
  }
  if (transaction?.contract?.iconUrl) {
    return (
      <View
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 3,
          overflow: 'visible',
        }}
      >
        <View
          style={{
            shadowColor: !transaction?.asset?.color ? globalColors.grey100 : transaction.asset.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            size={CardSize}
            style={{
              width: size,
              height: size,
              borderRadius: 10,
            }}
            source={{
              uri: transaction?.contract?.iconUrl,
            }}
          />
        </View>
        {transaction.network !== Network.mainnet && <ChainBadge network={transaction.network} badgeYPosition={0} />}
      </View>
    );
  }

  // fallback for contracts that we dont have data for
  if (transaction?.type === 'contract_interaction') {
    return (
      <Box
        alignItems="center"
        background="fillSecondary"
        borderRadius={10}
        height={{ custom: size }}
        justifyContent="center"
        style={{ opacity: theme.isDarkMode ? 0.5 : 0.75 }}
        width={{ custom: size }}
      >
        <Text align="center" color="labelQuaternary" size="icon 16px" weight="bold">
          􀎭
        </Text>
      </Box>
    );
  }

  if (transaction?.asset?.type === 'nft') {
    return (
      <View
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 3,
          overflow: 'visible',
        }}
      >
        <View
          style={{
            shadowColor: !transaction?.asset?.color ? globalColors.grey100 : transaction.asset.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          {/* @ts-ignore local nft assets have diff types */}
          {transaction.asset.icon_url || transaction.asset.image_url ? (
            <ImgixImage
              size={CardSize}
              style={{
                width: size,
                height: size,
                borderRadius: 10,
              }}
              source={{
                // @ts-ignore local nft assets have diff types
                uri: transaction.asset.icon_url || transaction.asset.image_url,
              }}
            />
          ) : (
            <Box
              alignItems="center"
              background="fillSecondary"
              borderRadius={10}
              height={{ custom: size }}
              justifyContent="center"
              style={{ opacity: theme.isDarkMode ? 0.5 : 0.75 }}
              width={{ custom: size }}
            >
              <Text align="center" color="labelQuaternary" size="icon 16px" weight="bold">
                􀏆
              </Text>
            </Box>
          )}
        </View>
        {transaction.network !== Network.mainnet && <ChainBadge network={transaction.network} badgeYPosition={0} />}
      </View>
    );
  }

  return (
    <View style={sx.iconContainer}>
      <RainbowCoinIcon
        size={40}
        icon={transaction?.asset?.icon_url}
        network={transaction?.asset?.network || Network.mainnet}
        symbol={transaction?.asset?.symbol || ''}
        theme={theme}
        colors={transaction?.asset?.colors}
      />
    </View>
  );
};

export default React.memo(function TransactionCoinRow({
  item,
  nativeCurrency,
  theme,
}: {
  item: RainbowTransaction;
  nativeCurrency: NativeCurrencyKey;
  theme: ThemeContextProps;
}) {
  const { colors } = theme;
  const navigation = useNavigation();

  const onPress = useCallback(() => {
    navigation.navigate(Routes.TRANSACTION_DETAILS, {
      transaction: item,
    });
  }, [item, navigation]);

  const [topValue, bottomValue] = activityValues(item, nativeCurrency) ?? [];

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96} uniqueId={`${item.hash}-${item.network}`}>
      <View style={sx.wholeRow} testID={`${item.title}-${item.description}-${item.balance?.display}`}>
        <View style={sx.icon}>
          <ActivityIcon size={40} transaction={item} theme={theme} />
        </View>

        <View style={sx.column}>
          <View style={sx.topRow}>
            <FastTransactionStatusBadge colors={colors} transaction={item} />
            <View style={sx.balance}>
              <Text color={'labelTertiary'} numberOfLines={1} size="14px / 19px (Deprecated)">
                {topValue}
              </Text>
            </View>
          </View>
          <BottomRow transaction={item} theme={theme} nativeCurrency={nativeCurrency} />
        </View>
      </View>
    </ButtonPressAnimation>
  );
});

const sx = StyleSheet.create({
  balance: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingLeft: 8,
  },
  iconContainer: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  bottomRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  column: {
    flex: 1,
    justifyContent: 'center',
    marginLeft: 10,
  },
  description: {
    flex: 1,
    maxWidth: '50%',
  },
  icon: {
    justifyContent: 'center',
  },
  nativeBalance: {
    marginLeft: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wholeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 19,
    overflow: 'visible',
    height: 59,
  },
});
