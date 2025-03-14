import { Box, Column, Columns, HitSlop, Inline, Text } from '@/design-system';
import React, { memo, useCallback, useMemo } from 'react';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { TextColor } from '@/design-system/color/palettes';
import { trimTrailingZeros } from '@/__swaps__/utils/swaps';
import { useUserAssetsListContext } from './UserAssetsListContext';
import { runOnJS } from 'react-native-reanimated';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

export const COIN_ROW_WITH_PADDING_HEIGHT = 56;

const STABLE_OBJECT = {};

export const CoinIcon = memo(function CoinIcon({
  index,
  size = 36,
  chainSize = size / 2,
}: {
  index: number;
  size?: number;
  chainSize?: number;
}) {
  const { icon_url, chainId, colors, symbol } =
    useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast())?.[index] || STABLE_OBJECT;

  return (
    <RainbowCoinIcon size={size} icon={icon_url} chainId={chainId} symbol={symbol || ''} color={colors?.primary} chainSize={chainSize} />
  );
});

const NativeBalance = ({ index }: { index: number }) => {
  const { native } = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast())?.[index] || STABLE_OBJECT;
  return <BalancePill showPriceChange balance={native?.balance.display ?? ''} />;
};

const Balance = ({ index }: { index: number }) => {
  const { balance } = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast())?.[index] || STABLE_OBJECT;

  if (!balance) return null;
  return (
    <Text color="labelTertiary" numberOfLines={1} size="13pt" weight="semibold">
      {balance.display}
    </Text>
  );
};

const PriceChange = ({ index }: { index: number }) => {
  const { native } = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast())?.[index] || STABLE_OBJECT;

  const percentChange = useMemo(() => {
    if (native?.price?.change) {
      const rawChange = parseFloat(native.price?.change);
      const isNegative = rawChange < 0;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${trimTrailingZeros(Math.abs(rawChange).toFixed(1))}%`;

      return { change, color, prefix };
    }
  }, [native?.price?.change]);

  if (!percentChange) return null;

  return (
    <Inline alignVertical="center" space={{ custom: 1 }} wrap={false}>
      <Text align="center" color={percentChange.color} size="12pt" weight="bold">
        {percentChange.prefix}
      </Text>
      <Text color={percentChange.color} size="13pt" weight="semibold">
        {percentChange.change}
      </Text>
    </Inline>
  );
};
const AssetName = ({ index }: { index: number }) => {
  const { name } = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast())?.[index] || STABLE_OBJECT;
  return (
    <Text color="label" size="17pt" weight="semibold" numberOfLines={1} ellipsizeMode="tail">
      {name}
    </Text>
  );
};

export function CoinRow({ index }: { index: number }) {
  const { isEditing, toggleSelectedAsset } = useUserAssetsListContext();

  const handleNavigateToAsset = useCallback((index: number) => {
    const asset = useUserAssetsStore.getState().getUserAssetsWithPinnedFirstAndHiddenAssetsLast()?.[index];
    if (!asset) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, { asset, address: asset.address, chainId: asset.chainId });
  }, []);

  const onPress = useCallback(() => {
    'worklet';
    if (isEditing.value) {
      toggleSelectedAsset(index);
    } else {
      runOnJS(handleNavigateToAsset)(index);
    }
  }, [index, handleNavigateToAsset, isEditing, toggleSelectedAsset]);

  return (
    <GestureHandlerButton disableHaptics onPressWorklet={onPress} scaleTo={0.95}>
      <Columns alignVertical="center">
        <Column>
          <HitSlop vertical="10px">
            <Box
              alignItems="center"
              paddingLeft="20px"
              paddingRight="20px"
              paddingVertical="10px"
              flexDirection="row"
              justifyContent="space-between"
              width="full"
              gap={12}
            >
              <Box flexDirection="row" gap={10} flexShrink={1} justifyContent="center">
                <CoinIcon index={index} />
                <Box gap={10} flexShrink={1} justifyContent="center">
                  <AssetName index={index} />
                  <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                    <Balance index={index} />
                  </Inline>
                </Box>
              </Box>
              <Box alignItems="flex-end">
                <NativeBalance index={index} />
                <PriceChange index={index} />
              </Box>
            </Box>
          </HitSlop>
        </Column>
      </Columns>
    </GestureHandlerButton>
  );
}
