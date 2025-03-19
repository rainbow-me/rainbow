import { Box, Column, Columns, HitSlop, Inline, Text, useColorMode } from '@/design-system';
import React, { memo, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { BalancePill } from '@/__swaps__/screens/Swap/components/BalancePill';
import { TextColor } from '@/design-system/color/palettes';
import { trimTrailingZeros } from '@/__swaps__/utils/swaps';
import { useUserAssetsListContext } from './UserAssetsListContext';
import Animated, { runOnJS, withTiming, useAnimatedStyle } from 'react-native-reanimated';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { borders, colors, padding, shadow } from '@/styles';
import { CoinIconIndicator } from '@/components/coin-icon';
import { Icon } from '@/components/icons';
import { UniqueId } from '@/__swaps__/types/assets';

export const COIN_ROW_WITH_PADDING_HEIGHT = 56;

export const CoinIcon = memo(function CoinIcon({
  uniqueId,
  size = 36,
  chainSize = size / 2,
}: {
  uniqueId: UniqueId;
  size?: number;
  chainSize?: number;
}) {
  const asset = useUserAssetsStore(state => state.getUserAsset(uniqueId));
  if (!asset) return null;

  return (
    <RainbowCoinIcon
      size={size}
      icon={asset.icon_url}
      chainId={asset.chainId}
      symbol={asset.symbol || ''}
      color={asset.colors?.primary}
      chainSize={chainSize}
    />
  );
});

const NativeBalance = ({ uniqueId }: { uniqueId: UniqueId }) => {
  const asset = useUserAssetsStore(state => state.getUserAsset(uniqueId));
  if (!asset?.native?.balance.display) return null;
  return <BalancePill showPriceChange balance={asset.native?.balance.display ?? ''} />;
};

const Balance = ({ uniqueId }: { uniqueId: UniqueId }) => {
  const asset = useUserAssetsStore(state => state.getUserAsset(uniqueId));
  if (!asset?.balance?.display) return null;
  return (
    <Text color="labelTertiary" numberOfLines={1} size="13pt" weight="semibold">
      {asset.balance.display}
    </Text>
  );
};

const PriceChange = ({ uniqueId }: { uniqueId: UniqueId }) => {
  const asset = useUserAssetsStore(state => state.getUserAsset(uniqueId));
  const percentChange = useMemo(() => {
    if (asset?.native?.price?.change) {
      const rawChange = parseFloat(asset.native.price?.change);
      const isNegative = rawChange < 0;
      const prefix = isNegative ? '-' : '+';
      const color: TextColor = isNegative ? 'red' : 'green';
      const change = `${trimTrailingZeros(Math.abs(rawChange).toFixed(1))}%`;

      return { change, color, prefix };
    }
  }, [asset?.native?.price?.change]);

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
const AssetName = ({ uniqueId }: { uniqueId: UniqueId }) => {
  const assetName = useUserAssetsStore(state => state.getUserAsset(uniqueId))?.name;
  if (!assetName) return null;
  return (
    <Text color="label" size="17pt" weight="semibold" numberOfLines={1} ellipsizeMode="tail">
      {assetName}
    </Text>
  );
};

const CoinCheckButton = memo(function CoinCheckButton({ uniqueId }: { uniqueId: UniqueId }) {
  const { isDarkMode } = useColorMode();
  const { selectedAssets, hiddenAssets, pinnedAssets } = useUserAssetsListContext();

  const outlineStyles = useAnimatedStyle(() => {
    const isHidden = hiddenAssets.value.includes(uniqueId);
    const isPinned = pinnedAssets.value.includes(uniqueId);
    const showOutline = !(isHidden || isPinned);

    return {
      opacity: showOutline ? 1 : 0,
      display: showOutline ? 'flex' : 'none',
    };
  });

  const pinnedPlaceholderStyles = useAnimatedStyle(() => {
    const selected = selectedAssets.value.includes(uniqueId);
    const isPinned = pinnedAssets.value.includes(uniqueId);
    const showPinnedIcon = !selected && isPinned;

    return {
      opacity: showPinnedIcon ? 1 : 0,
      display: showPinnedIcon ? 'flex' : 'none',
    };
  });

  const hiddenPlaceholderStyles = useAnimatedStyle(() => {
    const selected = selectedAssets.value.includes(uniqueId);
    const isHidden = hiddenAssets.value.includes(uniqueId);
    const isPinned = pinnedAssets.value.includes(uniqueId);
    const showHiddenIcon = !selected && isHidden && !isPinned;

    return {
      opacity: showHiddenIcon ? 1 : 0,
      display: showHiddenIcon ? 'flex' : 'none',
    };
  });

  const checkmarkStyles = useAnimatedStyle(() => {
    const selected = selectedAssets.value.includes(uniqueId);

    return {
      opacity: selected ? 1 : 0,
      display: selected ? 'flex' : 'none',
    };
  });

  return (
    <View style={sx.checkboxContainer}>
      <View style={sx.iconAlignmentWrapper}>
        <Animated.View style={[sx.circleOutline, outlineStyles]} />

        <Animated.View style={[sx.indicatorContainer, pinnedPlaceholderStyles]}>
          <CoinIconIndicator isPinned={true} />
        </Animated.View>

        <Animated.View style={[sx.indicatorContainer, hiddenPlaceholderStyles]}>
          <CoinIconIndicator isPinned={false} />
        </Animated.View>

        <Animated.View style={[sx.checkmarkBackground, isDarkMode ? sx.checkmarkShadowDark : sx.checkmarkShadowLight, checkmarkStyles]}>
          <Icon color="white" name="checkmark" />
        </Animated.View>
      </View>
    </View>
  );
});

export function CoinRow({ uniqueId }: { uniqueId: UniqueId }) {
  const { isEditing, toggleSelectedAsset } = useUserAssetsListContext();
  // const asset = useUserAssetsStore(state => state.getUserAsset(uniqueId));

  const handleNavigateToAsset = useCallback(() => {
    const asset = useUserAssetsStore.getState().getUserAsset(uniqueId);
    if (!asset) return;
    Navigation.handleAction(Routes.EXPANDED_ASSET_SHEET_V2, { asset, address: asset.address, chainId: asset.chainId });
  }, []);

  const checkmarkBackgroundDynamicStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(isEditing.value ? 40 : 0, TIMING_CONFIGS.fadeConfig),
      opacity: withTiming(isEditing.value ? 1 : 0, TIMING_CONFIGS.fadeConfig),
    };
  });

  const onPress = useCallback(() => {
    'worklet';
    if (isEditing.value) {
      toggleSelectedAsset(uniqueId);
    } else {
      runOnJS(handleNavigateToAsset)();
    }
  }, [handleNavigateToAsset, isEditing, toggleSelectedAsset]);

  return (
    <GestureHandlerButton disableHaptics onPressWorklet={onPress} scaleTo={0.95}>
      <Columns alignVertical="center">
        <Column width="content" style={checkmarkBackgroundDynamicStyle}>
          <CoinCheckButton uniqueId={uniqueId} />
        </Column>
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
                <CoinIcon uniqueId={uniqueId} />
                <Box gap={10} flexShrink={1} justifyContent="center">
                  <AssetName uniqueId={uniqueId} />
                  <Inline alignVertical="center" space={{ custom: 5 }} wrap={false}>
                    <Balance uniqueId={uniqueId} />
                  </Inline>
                </Box>
              </Box>
              <Box alignItems="flex-end">
                <NativeBalance uniqueId={uniqueId} />
                <PriceChange uniqueId={uniqueId} />
              </Box>
            </Box>
          </HitSlop>
        </Column>
      </Columns>
    </GestureHandlerButton>
  );
}

const sx = StyleSheet.create({
  bottom: {
    marginTop: 10,
  },
  iconContainer: {
    elevation: 6,
    height: 59,
    overflow: 'visible',
    paddingTop: 9,
  },
  checkboxContainer: {
    alignSelf: 'center',
    width: 24,
  },
  checkboxInnerContainer: {
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    height: 40,
    justifyContent: 'center',
    width: 51,
    position: 'relative',
  },
  iconAlignmentWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    position: 'relative',
  },
  checkmarkBackground: {
    ...borders.buildCircleAsObject(22),
    ...padding.object(4.5),
    backgroundColor: colors.appleBlue,
    position: 'absolute',
  },
  checkmarkShadowLight: {
    ...shadow.buildAsObject(0, 4, 12, colors.appleBlue, 0.4),
  },
  checkmarkShadowDark: {
    ...shadow.buildAsObject(0, 4, 12, colors.shadow, 0.4),
  },
  circleOutline: {
    ...borders.buildCircleAsObject(22),
    borderWidth: 1.5,
    borderColor: colors.alpha(colors.blueGreyDark, 0.12),
    position: 'absolute',
  },
  indicatorContainer: {
    position: 'absolute',
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    marginRight: 19,
    overflow: 'visible',
    paddingLeft: 9,
  },
  flex: {
    flex: 1,
  },
  hiddenRow: {
    opacity: 0.4,
  },
  innerContainer: {
    flex: 1,
    marginBottom: 1,
    marginLeft: 10,
  },
  nonEditMode: {
    paddingLeft: 10,
  },
  rootContainer: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'visible',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textWrapper: {
    flex: 1,
    paddingRight: 19,
  },
});
