import React, { memo, useCallback, useMemo, useState } from 'react';
import { AnimatedText, Box, Text, TextShadow, useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { useAccountSettings } from '@/hooks';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { Tabs } from '../shared/Tabs/Tabs';
import { useTokenInteractions } from '@/resources/metadata/tokenInteractions';
import { TokenInteraction, TokenInteractionDirection, TokenInteractionType } from '@/graphql/__generated__/metadata';
import { useTabContext } from '../shared/Tabs/TabContext';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { opacity } from '@/__swaps__/utils/swaps';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, { clamp, SharedTransition, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { format } from 'date-fns';
import { convertRawAmountToBalanceWorklet, convertRawAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { openInBrowser } from '@/utils/openInBrowser';
import * as i18n from '@/languages';
import { ceilWorklet, minWorklet, mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';

const l = i18n.l.expanded_state.sections.history;

// Layout constants
const DEFAULT_VISIBLE_ITEM_COUNT = 4;
const LIST_BUTTON_GAP = 20;
const ROW_HEIGHT = 32;
const ROW_PADDING = 24;
const LIST_PADDING = 4;
const MORE_BUTTON_HEIGHT = 36;

// Button styling constants
const MORE_BUTTON_BORDER_RADIUS = 20;
const MORE_BUTTON_PADDING_HORIZONTAL = 12;
const LIST_ITEM_BORDER_RADIUS = 18;
const LIST_ITEM_GAP = 11;
const ICON_TEXT_GAP = 5;

// Date format constants
const DATE_FORMAT = 'MMM d';

const moreButtonStyles = {
  borderWidth: THICK_BORDER_WIDTH,
  borderRadius: MORE_BUTTON_BORDER_RADIUS,
  height: MORE_BUTTON_HEIGHT,
  paddingHorizontal: MORE_BUTTON_PADDING_HORIZONTAL,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
const historyTransition = SharedTransition.custom(values => {
  'worklet';
  return {
    height: withSpring(values.targetHeight, SPRING_CONFIGS.springConfig),
  };
});

interface MoreButtonProps {
  tokenInteractions: TokenInteraction[];
}

function MoreButton({ tokenInteractions }: MoreButtonProps) {
  const { accentColors } = useExpandedAssetSheetContext();
  const { isExpanded } = useTabContext();

  const less = i18n.t(l.less);
  const more = i18n.t(l.more);

  const buttonLabel = useDerivedValue<string>(() => {
    return isExpanded.value ? less : more;
  });

  if (tokenInteractions.length <= DEFAULT_VISIBLE_ITEM_COUNT) {
    return null;
  }

  return (
    <GestureHandlerButton
      scaleTo={0.9}
      onPressWorklet={() => {
        'worklet';
        isExpanded.value = !isExpanded.value;
      }}
    >
      <Box
        style={[
          moreButtonStyles,
          {
            backgroundColor: accentColors.opacity3,
            borderColor: accentColors.opacity2,
          },
        ]}
      >
        <TextShadow blur={12} shadowOpacity={0.24}>
          <AnimatedText size="17pt" weight="heavy" color="accent">
            {buttonLabel}
          </AnimatedText>
        </TextShadow>
      </Box>
    </GestureHandlerButton>
  );
}

interface SkeletonRowProps {
  width: number;
  height: number;
}

const SkeletonRow = ({ width, height }: SkeletonRowProps) => {
  const { isDarkMode } = useColorMode();
  const { accentColors } = useExpandedAssetSheetContext();
  const fillTertiary = useBackgroundColor('fillTertiary');
  const shimmerColor = opacity(fillTertiary, isDarkMode ? 0.025 : 0.06);

  return (
    <Box
      backgroundColor={accentColors.surfaceSecondary}
      height={{ custom: height }}
      width={{ custom: width }}
      borderRadius={LIST_ITEM_BORDER_RADIUS}
      style={{ overflow: 'hidden' }}
    >
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </Box>
  );
};

interface ListItemProps {
  item: TokenInteraction;
  nativeCurrency: NativeCurrencyKey;
}

export const ListItem = memo(function ListItem({ item, nativeCurrency }: ListItemProps) {
  const { accentColors, basicAsset: asset } = useExpandedAssetSheetContext();
  const labelTertiary = useForegroundColor('labelTertiary');

  const icon = useMemo(() => {
    switch (item.type) {
      case TokenInteractionType.Bought:
        return '􁾯';
      case TokenInteractionType.Sold:
        return '􁾫';
      case TokenInteractionType.Received:
        return '􀄩';
      case TokenInteractionType.Sent:
        return '􀈟';
      default:
        return '';
    }
  }, [item.type]);

  const symbol = useMemo(() => {
    return item.direction === TokenInteractionDirection.In ? '􀅼' : '-';
  }, [item.direction]);

  const iconColor = useMemo(() => {
    return item.direction === TokenInteractionDirection.In ? accentColors.color : labelTertiary;
  }, [item.direction, accentColors.color, labelTertiary]);

  const direction = useMemo(() => {
    switch (item.type) {
      case TokenInteractionType.Bought:
        return i18n.t(l.bought);
      case TokenInteractionType.Sold:
        return i18n.t(l.sold);
      case TokenInteractionType.Received:
        return i18n.t(l.received);
      case TokenInteractionType.Sent:
        return i18n.t(l.sent);
      default:
        return i18n.t(l.unknown);
    }
  }, [item.type]);

  const shortenedMonth = useMemo(() => {
    return format(new Date(item.interactedAt * 1000), DATE_FORMAT);
  }, [item.interactedAt]);

  const nativeAmount = useMemo(() => {
    return convertRawAmountToNativeDisplay(item.amount, asset.decimals, item.price ?? 0, nativeCurrency);
  }, [item.amount, asset.decimals, item.price, nativeCurrency]);

  const currencyAmount = useMemo(() => {
    return convertRawAmountToBalanceWorklet(item.amount, asset).display.replace(asset.symbol, '');
  }, [item.amount, asset]);

  const navigateToTransaction = useCallback(() => {
    openInBrowser(item.explorerURL);
  }, [item.explorerURL]);

  return (
    <Box as={ButtonPressAnimation} scaleTo={0.94} onPress={navigateToTransaction} height={ROW_HEIGHT} gap={LIST_ITEM_GAP} width="full">
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" alignItems="center" gap={ICON_TEXT_GAP}>
          <Text size="icon 11px" color={{ custom: iconColor }} weight="bold">
            {icon}
          </Text>
          <Text size="13pt" color={{ custom: iconColor }} weight="semibold">
            {direction}
          </Text>
        </Box>
        <Text size="13pt" color="labelQuaternary" weight="medium">
          {shortenedMonth}
        </Text>
      </Box>
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box flexDirection="row" alignItems="center" gap={ICON_TEXT_GAP}>
          <Text size={item.direction === TokenInteractionDirection.Out ? 'icon 17px' : 'icon 11px'} color="labelSecondary" weight="bold">
            {symbol}
          </Text>
          <Text size="17pt" color="labelSecondary" weight="medium">
            {currencyAmount} {asset.symbol}
          </Text>
        </Box>
        <Text size="17pt" color="labelSecondary" weight="medium">
          {nativeAmount.display}
        </Text>
      </Box>
    </Box>
  );
});

interface ListDataProps {
  data: TokenInteraction[];
  buys: TokenInteraction[];
  sells: TokenInteraction[];
  isLoading: boolean;
}

export const ListData = memo(function ListData({ data, buys, sells, isLoading }: ListDataProps) {
  const { nativeCurrency } = useAccountSettings();
  const { activeTabIndex, isExpanded } = useTabContext();

  const [tabIndex, setTabIndex] = useState<number>(activeTabIndex.value);

  useSyncSharedValue({
    state: tabIndex,
    setState: setTabIndex,
    sharedValue: activeTabIndex,
    syncDirection: 'sharedValueToState',
  });

  const filteredTokenInteractions = useMemo(() => {
    if (tabIndex === 1) return buys;
    if (tabIndex === 2) return sells;

    return data;
  }, [tabIndex, data, buys, sells]);

  const calculateContainerHeight = useCallback((interactions: TokenInteraction[], isExpanded: boolean) => {
    'worklet';

    const minOfTwoOptions = minWorklet(interactions.length, DEFAULT_VISIBLE_ITEM_COUNT);
    const shouldShowMoreButton = interactions.length > DEFAULT_VISIBLE_ITEM_COUNT;
    const moreButtonHeight = shouldShowMoreButton ? MORE_BUTTON_HEIGHT : -16;
    const rowHeightWithPadding = ROW_HEIGHT + ROW_PADDING;
    const amount = isExpanded ? interactions.length : minOfTwoOptions;

    const rowHeight = mulWorklet(amount, rowHeightWithPadding);
    return Number(ceilWorklet(sumWorklet(rowHeight, moreButtonHeight)));
  }, []);

  const containerStyles = useAnimatedStyle(() => {
    const height = calculateContainerHeight(filteredTokenInteractions, isExpanded.value);
    return {
      height: withSpring(clamp(height, 0, height), SPRING_CONFIGS.springConfig),
    };
  });

  const loaderStyles = useAnimatedStyle(() => {
    const shouldShowMoreButton = filteredTokenInteractions.length > DEFAULT_VISIBLE_ITEM_COUNT;
    const moreButtonHeight = shouldShowMoreButton ? MORE_BUTTON_HEIGHT + LIST_BUTTON_GAP : 0;
    const loaderHeight =
      DEFAULT_VISIBLE_ITEM_COUNT * ROW_HEIGHT + (DEFAULT_VISIBLE_ITEM_COUNT - 1) * ROW_PADDING + LIST_PADDING * 2 + moreButtonHeight;

    return {
      height: withTiming(isLoading && filteredTokenInteractions.length === 0 ? loaderHeight : 0, TIMING_CONFIGS.fastFadeConfig),
      opacity: withTiming(isLoading && filteredTokenInteractions.length === 0 ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
    };
  });

  const listStyles = useAnimatedStyle(() => {
    return {
      opacity: withTiming(filteredTokenInteractions.length !== 0 ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
    };
  });

  const renderItem = useCallback(
    ({ item }: { item: TokenInteraction }) => {
      return <ListItem item={item} nativeCurrency={nativeCurrency} />;
    },
    [nativeCurrency]
  );

  return (
    <Box as={Animated.View} style={[containerStyles, { position: 'relative' }]}>
      <Box as={Animated.View} style={loaderStyles} sharedTransitionTag="history-section" sharedTransitionStyle={historyTransition} gap={24}>
        {Array.from({ length: DEFAULT_VISIBLE_ITEM_COUNT }).map((_, index) => (
          <SkeletonRow key={index} width={DEVICE_WIDTH - 48} height={ROW_HEIGHT} />
        ))}
      </Box>

      <Animated.FlatList
        sharedTransitionTag="history-section"
        sharedTransitionStyle={historyTransition}
        data={filteredTokenInteractions}
        style={[listStyles, { paddingVertical: LIST_PADDING }]}
        contentContainerStyle={{ gap: 24 }}
        scrollEnabled={false}
        renderItem={renderItem}
      />
      <MoreButton tokenInteractions={filteredTokenInteractions} />
    </Box>
  );
});

export const HistorySection = memo(function HistorySection() {
  const { accentColors, tokenInteractions, isLoadingTokenInteractions } = useExpandedAssetSheetContext();

  const buys = useMemo(() => {
    return tokenInteractions?.filter(interaction => interaction.direction === TokenInteractionDirection.In);
  }, [tokenInteractions]);

  const sells = useMemo(() => {
    return tokenInteractions?.filter(interaction => interaction.direction === TokenInteractionDirection.Out);
  }, [tokenInteractions]);

  const TABS = useMemo(() => {
    const tabs = [i18n.t(l.tabs.all)];
    if (buys.length > 0) tabs.push(i18n.t(l.tabs.buys));
    if (sells.length > 0) tabs.push(i18n.t(l.tabs.sells));
    return tabs;
  }, [buys, sells]);

  if (TABS.length < 3) {
    return <ListData data={tokenInteractions} buys={buys} sells={sells} isLoading={isLoadingTokenInteractions} />;
  }

  // NOTE: Only show tabs if we have more than one type of transaction
  return (
    <Tabs tabs={TABS} useViewController={false} accentColor={accentColors.color}>
      <ListData data={tokenInteractions} buys={buys} sells={sells} isLoading={isLoadingTokenInteractions} />
    </Tabs>
  );
});
