import React, { memo, useCallback, useMemo } from 'react';
import { subWorklet } from '@/safe-math/SafeMath';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { ListRenderItem, StyleSheet } from 'react-native';
import { AnimatedText, Box, Inset, useForegroundColor } from '@/design-system';
import { convertAmountToNativeDisplay, isZero } from '@/helpers/utilities';
import { deviceUtils } from '@/utils';
import { useAccountSettings, withPerformanceTracking } from '@/hooks';
import { BaseButton } from '@/components/DappBrowser/TabViewToolbar';
import Animated, { useAnimatedStyle, useDerivedValue, withRepeat, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useUserAssetsListContext, DIVIDER_HEIGHT, MAX_CONDENSED_ASSETS, EditAction, UserAssetListItem } from './UserAssetsListContext';
import { COIN_ROW_WITH_PADDING_HEIGHT, CoinRow } from './CoinRow';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ChainId } from '@/state/backendNetworks/types';
import { AssetListItemSkeleton } from '@/components/asset-list';
import { EthCard } from '@/components/cards/EthCard';
import { ReceiveAssetsCard } from '@/components/cards/ReceiveAssetsCard';
import { RotatingLearnCard } from '@/components/cards/RotatingLearnCard';
import { DiscoverMoreButton } from '@/components/asset-list/RecyclerAssetList2/core/DiscoverMoreButton';
import { opacity } from '@/__swaps__/utils/swaps';
import { sliderConfig, pulsingConfig } from '@/__swaps__/screens/Swap/constants';

const keyExtractor = (item: UserAssetListItem): string => {
  if (item.type === 'asset') {
    return `asset-${item.uniqueId}`;
  }
  return `divider`;
};

const ListEmptyComponent = memo(function ListEmptyComponent() {
  const mainnetEthBalance = useUserAssetsStore(state => state.getNativeAssetForChain(ChainId.mainnet))?.balance.amount ?? 0;
  const isLoading = useUserAssetsStore(state => state.status === 'loading');

  if (isZero(mainnetEthBalance) && !isLoading) {
    return (
      <Inset horizontal="20px">
        <Box paddingVertical="24px" alignItems="center" gap={12}>
          <ReceiveAssetsCard />
          <EthCard />
          <RotatingLearnCard />
          <Box paddingVertical="12px">
            <DiscoverMoreButton />
          </Box>
        </Box>
      </Inset>
    );
  }

  return (
    <>
      {Array.from({ length: MAX_CONDENSED_ASSETS - 1 }, (_, index) => (
        <AssetListItemSkeleton animated descendingOpacity index={index} key={`skeleton${index}`} />
      ))}
    </>
  );
});

function UserAssetsListComponent() {
  const { flatlistRef, isExpanded } = useUserAssetsListContext();

  const userAssets = useUserAssetsStore(state => state.getUserAssetsWithPinnedFirstAndHiddenAssetsLast());

  const data = useMemo(() => {
    const topSection = userAssets
      .slice(0, MAX_CONDENSED_ASSETS)
      .map(asset => ({ type: 'asset' as const, uniqueId: asset.uniqueId, sectionId: 'top-assets' as const }));
    const divider = { type: 'divider' as const, sectionId: 'divider' as const };
    const bottomSection = userAssets
      .slice(MAX_CONDENSED_ASSETS)
      .map(asset => ({ type: 'asset' as const, uniqueId: asset.uniqueId, sectionId: 'bottom-assets' as const }));

    return [...topSection, divider, ...bottomSection];
  }, [userAssets]);

  const renderItem: ListRenderItem<UserAssetListItem> = useCallback(({ item }) => {
    if (item.type === 'divider') {
      return <DividerSection />;
    }

    return <CoinRow uniqueId={item.uniqueId} />;
  }, []);

  const listStyle = useAnimatedStyle(() => {
    return {
      height: withSpring(
        isExpanded.value
          ? userAssets.length * COIN_ROW_WITH_PADDING_HEIGHT + DIVIDER_HEIGHT
          : MAX_CONDENSED_ASSETS * COIN_ROW_WITH_PADDING_HEIGHT + DIVIDER_HEIGHT,
        TIMING_CONFIGS.fastFadeConfig
      ),
    };
  });

  if (userAssets.length === 0) {
    return <ListEmptyComponent />;
  }

  return (
    <Animated.FlatList
      data={data}
      ref={flatlistRef}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      initialNumToRender={MAX_CONDENSED_ASSETS + 1}
      scrollEnabled={false}
      style={[listStyle, { flex: 1, width: deviceUtils.dimensions.width, paddingBottom: 12 }]}
      showsVerticalScrollIndicator={false}
      windowSize={30}
    />
  );
}

export const UserAssetsList = withPerformanceTracking(UserAssetsListComponent);

const Balance = () => {
  const { isExpanded } = useUserAssetsListContext();
  const { nativeCurrency } = useAccountSettings();

  const textColor = useForegroundColor('labelTertiary');
  const zeroAmountColor = opacity(textColor, 0.3);

  const isLoading = useUserAssetsStore(state => state.status === 'loading');
  const totalBalance = useUserAssetsStore(state => state.getTotalBalance());
  const hiddenBalance = useUserAssetsStore(state => state.hiddenAssetsBalance);

  const balance = useMemo(() => {
    if (typeof totalBalance === 'undefined') return undefined;
    if (!hiddenBalance) return totalBalance;
    return subWorklet(totalBalance, hiddenBalance);
  }, [totalBalance, hiddenBalance]);

  const balanceStyles = useAnimatedStyle(() => {
    const loadingOpacity = isLoading
      ? withRepeat(withSequence(withTiming(0.5, pulsingConfig), withTiming(1, pulsingConfig)), -1, true)
      : withSpring(1, sliderConfig);

    return {
      color: withTiming(isLoading ? zeroAmountColor : textColor, TIMING_CONFIGS.slowFadeConfig),
      opacity: isExpanded.value ? 0 : loadingOpacity,
      display: isExpanded.value ? 'none' : 'flex',
    };
  });

  return (
    <AnimatedText color="labelTertiary" size="17pt" weight="semibold" numberOfLines={1} style={balanceStyles}>
      {convertAmountToNativeDisplay(balance ?? '0', nativeCurrency)}
    </AnimatedText>
  );
};

const ExpandButton = () => {
  const { isExpanded, isEditing, toggleExpanded } = useUserAssetsListContext();

  const label = useDerivedValue<string>(() => {
    // TODO: i18n
    return isExpanded.value ? 'Less 􀆇' : 'All 􀆊';
  });

  const buttonStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isEditing.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig),
      display: isEditing.value ? 'none' : 'flex',
    };
  });

  return (
    <BaseButton paddingHorizontal="12px" paddingVertical="10px" onPressWorklet={toggleExpanded} style={buttonStyles}>
      <AnimatedText size="17pt" color="labelTertiary" weight="semibold" numberOfLines={1}>
        {label}
      </AnimatedText>
    </BaseButton>
  );
};

// TODO: Get 'accent' background color to work with useAnimatedStyle and BaseButton
function EditButton() {
  const { isEditing, isExpanded, toggleEditing } = useUserAssetsListContext();

  const labelColor = useForegroundColor('label');
  const labelTertiaryColor = useForegroundColor('labelTertiary');

  const buttonStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isExpanded.value ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
      // backgroundColor: withTiming(isEditing.value ? accentColor : fillSecondaryColor, TIMING_CONFIGS.fastFadeConfig),
      display: isExpanded.value ? 'flex' : 'none',
    };
  });

  const label = useDerivedValue<string>(() => {
    return isEditing.value ? 'Done' : 'Edit';
  });

  const textStyles = useAnimatedStyle(() => {
    return {
      color: withTiming(isEditing.value ? labelColor : labelTertiaryColor, TIMING_CONFIGS.tabPressConfig),
    };
  });

  return (
    <BaseButton style={buttonStyles} paddingHorizontal="12px" paddingVertical="10px" onPressWorklet={toggleEditing}>
      <AnimatedText style={textStyles} size="17pt" weight="semibold" numberOfLines={1}>
        {label}
      </AnimatedText>
    </BaseButton>
  );
}

function PinButtons() {
  const { isEditing, selectedAssets, currentAction, finishEditing } = useUserAssetsListContext();

  const labelColor = useForegroundColor('label');
  const labelTertiaryColor = useForegroundColor('labelTertiary');

  const handlePinPress = useCallback(() => {
    'worklet';
    finishEditing(currentAction.value === EditAction.unpin ? EditAction.unpin : EditAction.pin);
  }, [finishEditing, currentAction]);

  const handleHidePress = useCallback(() => {
    'worklet';
    finishEditing(currentAction.value === EditAction.unhide ? EditAction.unhide : EditAction.hide);
  }, [finishEditing, currentAction]);

  const containerStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isEditing.value ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
      display: isEditing.value ? 'flex' : 'none',
    };
  });

  const buttonStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isEditing.value ? (selectedAssets.value.length > 0 ? 1 : 0.4) : 0, TIMING_CONFIGS.fastFadeConfig),
      pointerEvents: isEditing.value && selectedAssets.value.length > 0 ? 'auto' : 'none',
    };
  });

  // TODO: i18n
  const pinLabel = useDerivedValue<string>(() => {
    if (currentAction.value === EditAction.unpin) {
      return 'Unpin';
    }
    return 'Pin';
  });

  // TODO: i18n
  const hideLabel = useDerivedValue<string>(() => {
    if (currentAction.value === EditAction.unhide) {
      return 'Unhide';
    }
    return 'Hide';
  });

  const textStyles = useAnimatedStyle(() => {
    return {
      color: withTiming(isEditing.value ? labelColor : labelTertiaryColor, TIMING_CONFIGS.tabPressConfig),
    };
  });

  return (
    <Animated.View style={[sx.actionButtons, containerStyles]}>
      <BaseButton paddingHorizontal="12px" paddingVertical="10px" onPressWorklet={handlePinPress} style={buttonStyles}>
        <AnimatedText style={textStyles} size="17pt" weight="semibold" numberOfLines={1}>
          {pinLabel}
        </AnimatedText>
      </BaseButton>
      <BaseButton paddingHorizontal="12px" paddingVertical="10px" onPressWorklet={handleHidePress} style={buttonStyles}>
        <AnimatedText style={textStyles} size="17pt" weight="semibold" numberOfLines={1}>
          {hideLabel}
        </AnimatedText>
      </BaseButton>
    </Animated.View>
  );
}

function DividerSection() {
  return (
    <Animated.View style={sx.container} testID="assets-list-divider">
      <Box style={sx.leftSide}>
        <ExpandButton />
        <PinButtons />
      </Box>
      <Box style={sx.rightSide}>
        <Balance />
        <EditButton />
      </Box>
    </Animated.View>
  );
}

const sx = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: DIVIDER_HEIGHT,
  },
  leftSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  rightSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'center',
    position: 'absolute',
    left: 0,
  },
});
