import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { ButtonPressAnimation } from '../animations';
import FastCoinIcon from '../asset-list/RecyclerAssetList2/FastComponents/FastCoinIcon';
import FastTransactionStatusBadge from './FastTransactionStatusBadge';
import { Box, Inline, Text, globalColors, useColorMode } from '@/design-system';
import { RainbowTransaction, TransactionStatusTypes } from '@/entities';
import { ThemeContextProps } from '@/theme';
import { useNavigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import { ImgixImage } from '../images';
import { CardSize } from '../unique-token/CardSize';
import { ChainBadge } from '../coin-icon';
import { Network } from '@/networks/types';
import { ETH_ADDRESS, ETH_SYMBOL } from '@/references';
import { address } from '@/utils/abbreviations';
import { Colors } from '@/styles';
import { TransactionType } from '@/resources/transactions/types';
import {
  convertAmountAndPriceToNativeDisplay,
  convertAmountToBalanceDisplay,
} from '@/helpers/utilities';

export const getApprovalLabel = ({
  approvalAmount,
  asset,
  type,
}: Pick<RainbowTransaction, 'type' | 'asset' | 'approvalAmount'>) => {
  if (!approvalAmount || !asset) return;
  if (approvalAmount === 'UNLIMITED') return 'approvals.unlimited';
  if (type === 'revoke') return 'approvals.no_allowance';
  return `${approvalAmount} ${asset.symbol}`;
};

const approvalTypeValues = (transaction: RainbowTransaction) => {
  const { asset, approvalAmount, hash, contract } = transaction;

  if (!asset || !approvalAmount) return;
  return getApprovalLabel(transaction);

  // return [
  //   contract?.name ? (
  //     <Inline key={`app${hash}`} alignVertical="center" space="4px">
  //       {contract.iconUrl && (
  //         <Text size="11pt" weight="semibold" color="labelTertiary">
  //         {'Con Icon'}
  //       </Text>
  //       )}
  //       {contract.name}
  //     </Inline>
  //   ) : null,
  //   label && (
  //     <Box
  //       key={`approval${hash}`}
  //       style={{ borderStyle: 'dashed', borderRadius: 6, borderColor: 'red', borderWidth: 1 }}
  //     >
  //       <Text size="11pt" weight="semibold" color="labelTertiary">
  //         {label}
  //       </Text>
  //     </Box>
  //   ),
  // ];
};

const swapTypeValues = (changes: RainbowTransaction['changes']) => {
  const tokenIn = changes?.filter(c => c?.direction === 'in')[0];
  const tokenOut = changes?.filter(c => c?.direction === 'out')[0];

  if (!tokenIn?.asset.balance?.amount || !tokenOut?.asset.balance?.amount)
    return;

  const valueOut = `-${convertAmountToBalanceDisplay(
    tokenOut?.asset.balance?.amount,
    { ...tokenOut?.asset }
  )}`;
  const valueIn = `+${convertAmountToBalanceDisplay(
    tokenIn?.asset.balance?.amount,
    { ...tokenIn?.asset }
  )}`;

  return [valueOut, valueIn];
};

const activityValues = (transaction: RainbowTransaction) => {
  const { changes, direction, type } = transaction;
  if (['swap', 'wrap', 'unwrap'].includes(type)) return swapTypeValues(changes);
  if (['approve', 'revoke'].includes(type))
    return approvalTypeValues(transaction);

  const asset = changes?.filter(
    c => c?.direction === direction && c?.asset.type !== 'nft'
  )[0]?.asset;
  const valueSymbol = direction === 'out' ? '-' : '+';

  if (!asset) return;

  const { balance } = asset;
  if (balance?.amount === '0') return;

  const assetValue = `${balance?.amount} ${asset.symbol}`;

  const nativeBalance = '0';
  const assetNativeValue =
    +nativeBalance > 0 ? `${valueSymbol}${nativeBalance}` : 'no value';

  return +nativeBalance > 0
    ? [assetValue, assetNativeValue]
    : [assetNativeValue, `${valueSymbol}${assetValue}`];
};

const activityTypeIcon: Record<TransactionType, string> = {
  airdrop: '􀐚',
  approve: '􀁢',
  contract_interaction: '􀉆',
  receive: '􀄩',
  send: '􀈠',
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
}: {
  transaction: Pick<RainbowTransaction, 'status' | 'type'>;
}) => {
  // if (status === 'pending') return null;
  if (status === 'failed')
    return (
      <Text color="labelTertiary" weight="semibold" size="11pt">
        {'X'}
      </Text>
    );

  const symbol = activityTypeIcon[type];
  if (!symbol) return null;
  return (
    <Text color="labelTertiary" weight="semibold" size="11pt">
      {symbol}
    </Text>
  );
};

const BottomRow = React.memo(function BottomRow({
  transaction,
  theme,
}: {
  transaction: RainbowTransaction;
  theme: ThemeContextProps;
}) {
  const { status, type, native, to, asset } = transaction;
  const { colors } = theme;
  const isFailed = status === TransactionStatusTypes.failed;
  const isReceived =
    status === TransactionStatusTypes.received ||
    status === TransactionStatusTypes.purchased;
  const isSent = status === TransactionStatusTypes.sent;
  const isSold = status === TransactionStatusTypes.sold;

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
  if (isSold) balanceTextColor = colors.green;

  const balanceText = native?.display
    ? [isFailed || isSent ? '-' : null, native.display]
        .filter(Boolean)
        .join(' ')
    : '';

  let description = transaction.description;
  let tag: string | undefined;
  if (type === 'contract_interaction' && to) {
    description = transaction.contract?.name || address(to, 6, 4);
    tag = transaction.description;
  }

  const nftChangesAmount = transaction.changes
    ?.filter(
      c => asset?.address === c?.asset.address && c?.asset.type === 'nft'
    )
    .filter(Boolean).length;
  if (nftChangesAmount) tag = nftChangesAmount.toString();

  const [topValue, bottomValue] = activityValues(transaction) ?? [];
  return (
    <View style={sx.bottomRow}>
      <View style={sx.description}>
        <Inline>
          <Text
            color={{ custom: coinNameColor || colors.dark }}
            numberOfLines={1}
            size="16px / 22px (Deprecated)"
          >
            {description}
          </Text>
          {tag && (
            <Box
              style={{
                borderWidth: 2,
                borderRadius: 5,
                width: 20,
                height: 20,
                borderColor: colors.dark,
                alignItems: 'center',
              }}
            >
              <Text
                align="right"
                color={{ custom: balanceTextColor ?? colors.dark }}
                size="16px / 22px (Deprecated)"
                weight={isReceived ? 'medium' : undefined}
              >
                {tag}
              </Text>
            </Box>
          )}
        </Inline>
      </View>
      <View style={sx.nativeBalance}>
        <Text
          align="right"
          color={bottomValue?.includes('+') ? 'green' : 'labelSecondary'}
          size="16px / 22px (Deprecated)"
          weight={isReceived ? 'medium' : undefined}
        >
          {bottomValue}
        </Text>
      </View>
    </View>
  );
});

export const ActivityIcon = ({
  transaction,
  size = 36,
  badge = true,
  theme,
}: {
  transaction: RainbowTransaction;
  badge?: boolean;
  size?: 36 | 20 | 14 | 16;
  theme: ThemeContextProps;
}) => {
  if (['wrap', 'undwrap', 'swap'].includes(transaction?.type)) {
    const inAsset = transaction?.changes?.find(a => a?.direction === 'in')
      ?.asset;
    const outAsset = transaction?.changes?.find(a => a?.direction === 'out')
      ?.asset;

    if (!!inAsset && !!outAsset)
      return (
        <Inline>
          <FastCoinIcon
            address={inAsset?.address || ETH_ADDRESS}
            network={transaction.network}
            mainnetAddress={inAsset?.mainnet_address}
            symbol={inAsset?.symbol || ETH_SYMBOL}
            theme={theme}
          />
          <FastCoinIcon
            address={outAsset?.address || ETH_ADDRESS}
            network={transaction.network}
            mainnetAddress={outAsset?.mainnet_address}
            symbol={outAsset?.symbol || ETH_SYMBOL}
            theme={theme}
          />
        </Inline>
      );
  }
  if (transaction?.contract?.iconUrl) {
    return (
      <View
        style={{
          shadowColor: globalColors.grey100,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.02,
          shadowRadius: 3,
          paddingTop: 9,
          paddingBottom: 10,
          overflow: 'visible',
        }}
      >
        <View
          style={{
            shadowColor: !transaction?.asset?.color
              ? globalColors.grey100
              : transaction.asset.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            size={CardSize}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
            }}
            source={{
              uri: transaction?.contract?.iconUrl,
            }}
          />
        </View>
        {transaction.network !== Network.mainnet && (
          <ChainBadge network={transaction.network} badgeYPosition={10} />
        )}
      </View>
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
          paddingTop: 9,
          paddingBottom: 10,
          overflow: 'visible',
        }}
      >
        <View
          style={{
            shadowColor: !transaction?.asset?.color
              ? globalColors.grey100
              : transaction.asset.color,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.24,
            shadowRadius: 9,
          }}
        >
          <ImgixImage
            size={CardSize}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
            }}
            source={{
              uri: transaction.asset.icon_url,
            }}
          />
        </View>
        {transaction.network !== Network.mainnet && (
          <ChainBadge network={transaction.network} badgeYPosition={10} />
        )}
      </View>
    );
  }

  return (
    <FastCoinIcon
      address={transaction.asset?.address || ETH_ADDRESS}
      network={transaction.network}
      mainnetAddress={transaction.asset?.mainnet_address}
      symbol={transaction.asset?.symbol || ETH_SYMBOL}
      theme={theme}
    />
  );
};

const ActivityDescription = ({
  transaction,
  colors,
}: {
  transaction: RainbowTransaction;
  colors: Colors;
}) => {
  const { type, to, asset } = transaction;
  let description = transaction.description;
  let tag: string | undefined;
  if (type === 'contract_interaction' && to) {
    description = transaction.contract?.name || address(to, 6, 4);
    tag = transaction.description;
  }

  const nftChangesAmount = transaction.changes
    ?.filter(
      c => asset?.address === c?.asset.address && c?.asset.type === 'nft'
    )
    .filter(Boolean).length;
  if (nftChangesAmount) tag = nftChangesAmount.toString();

  return (
    <Inline space="4px" alignVertical="center" wrap={false}>
      <Text
        size="16px / 22px (Deprecated)"
        weight="semibold"
        color={{ custom: colors.dark }}
      >
        {description}
      </Text>
      {tag && (
        <Text
          size="16px / 22px (Deprecated)"
          weight="semibold"
          color={{ custom: colors.dark }}
        >
          {tag}
        </Text>
      )}
    </Inline>
  );
};

export default React.memo(function TransactionCoinRow({
  item,
  theme,
}: {
  item: RainbowTransaction;
  theme: ThemeContextProps;
}) {
  const { colorMode } = useColorMode();
  const { colors } = theme;
  const navigation = useNavigation();

  const onPress = useCallback(() => {
    console.log('changes: ', item?.changes?.[0]?.asset);
    console.log('asset: ', item?.asset);
    navigation.navigate(Routes.TRANSACTION_DETAILS, {
      transaction: item,
    });
  }, [item, navigation]);

  const [topValue, bottomValue] = activityValues(item) ?? [];

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.96}>
      <View
        style={sx.wholeRow}
        testID={`${item.title}-${item.description}-${item.balance?.display}`}
      >
        <View style={sx.icon}>
          <ActivityIcon size={36} transaction={item} theme={theme} />
        </View>
        <View style={sx.column}>
          <View style={sx.topRow}>
            <FastTransactionStatusBadge colors={colors} transaction={item} />
            <View style={sx.balance}>
              <Text
                color={{ custom: colors.alpha(colors.blueGreyDark, 0.5) }}
                numberOfLines={1}
                size="14px / 19px (Deprecated)"
              >
                {topValue}
              </Text>
            </View>
          </View>
          <BottomRow transaction={item} theme={theme} />
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
  },
});
