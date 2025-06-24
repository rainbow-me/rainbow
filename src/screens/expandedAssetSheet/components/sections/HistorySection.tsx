import React, { memo, useCallback, useMemo, useState } from 'react';
import { AnimatedText, Box, Text, TextShadow, useBackgroundColor, useColorMode, useForegroundColor } from '@/design-system';
import { SectionId, useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import { ButtonPressAnimation, ShimmerAnimation } from '@/components/animations';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { Tabs } from '../shared/Tabs/Tabs';
import { TokenInteraction, TokenInteractionDirection, TokenInteractionType } from '@/graphql/__generated__/metadata';
import { useTabContext } from '../shared/Tabs/TabContext';
import { opacity } from '@/__swaps__/utils/swaps';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import Animated, {
  clamp,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
  withDelay,
  useSharedValue,
} from 'react-native-reanimated';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { format } from 'date-fns';
import { convertRawAmountToBalanceWorklet, convertRawAmountToNativeDisplay } from '@/helpers/utilities';
import { NativeCurrencyKey } from '@/entities/nativeCurrencyTypes';
import { openInBrowser } from '@/utils/openInBrowser';
import * as i18n from '@/languages';
import { minWorklet, mulWorklet, subWorklet, sumWorklet } from '@/safe-math/SafeMath';
import { useTokenInteractions } from '@/resources/metadata/tokenInteractions';
import { CollapsibleSection, LAYOUT_ANIMATION } from '../shared/CollapsibleSection';
import { SheetSeparator } from '../shared/Separator';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

const l = i18n.l.expanded_state.sections.history;

// Layout constants
const DEFAULT_VISIBLE_ITEM_COUNT = 4;
const LIST_BUTTON_GAP = 20;
const ROW_HEIGHT = 32;
const ROW_PADDING = 24;
const MORE_BUTTON_HEIGHT = 36;
const LIST_PADDING = 4;

// Button styling constants
const MORE_BUTTON_BORDER_RADIUS = 20;
const MORE_BUTTON_PADDING_HORIZONTAL = 12;
const LIST_ITEM_BORDER_RADIUS = 18;
const LIST_ITEM_GAP = 11;
const ICON_TEXT_GAP = 5;

// Animation constants
const ITEM_DELAY = 10;

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

const buttonWrapperStyles = {
  gap: LIST_ITEM_GAP,
};

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
  index: number;
  item: TokenInteraction;
  nativeCurrency: NativeCurrencyKey;
  listHeight: SharedValue<number>;
  isExpanded: SharedValue<boolean>;
  totalItemCount: number;
}

const flexStyles = {
  flex: 1,
};

const calculateContainerHeight = (interactions: TokenInteraction[], isExpanded: boolean) => {
  'worklet';

  const hasMoreButton = interactions.length > DEFAULT_VISIBLE_ITEM_COUNT;
  const moreButtonPadding = hasMoreButton ? LIST_BUTTON_GAP + LIST_PADDING * 2 - 1 : LIST_PADDING * 2;

  const visibleItemCount = isExpanded ? interactions.length : minWorklet(interactions.length, DEFAULT_VISIBLE_ITEM_COUNT);
  const totalRowHeight = mulWorklet(visibleItemCount, ROW_HEIGHT);
  const totalGapHeight = Number(visibleItemCount) > 1 ? mulWorklet(subWorklet(visibleItemCount, 1), ROW_PADDING) : 0;
  const totalHeight = sumWorklet(sumWorklet(totalRowHeight, totalGapHeight), moreButtonPadding);

  return Math.max(0, Number(totalHeight));
};

export const ListItem = memo(function ListItem({ index, item, nativeCurrency, listHeight, isExpanded, totalItemCount }: ListItemProps) {
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

  const isVisibleStyles = useAnimatedStyle(() => {
    const occupyingSpace = index * (ROW_HEIGHT + ROW_PADDING);
    const isVisible = occupyingSpace <= listHeight.value;

    const forwardDelay = index * ITEM_DELAY;
    const reverseDelay = Math.max(0, totalItemCount - 1 - index) * ITEM_DELAY;
    const delay = isExpanded.value ? forwardDelay : reverseDelay;

    return {
      opacity: withDelay(delay, withTiming(isVisible ? 1 : 0, TIMING_CONFIGS.fadeConfig)),
    };
  });

  return (
    <Box as={Animated.View} style={isVisibleStyles} height={ROW_HEIGHT}>
      <Box as={ButtonPressAnimation} scaleTo={0.94} onPress={navigateToTransaction} style={buttonWrapperStyles}>
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
        <Box flexDirection="row" gap={12} justifyContent="space-between" alignItems="center">
          <Box style={flexStyles} overflow="hidden">
            <Box flexDirection="row" alignItems="center" gap={ICON_TEXT_GAP}>
              <Text
                size={item.direction === TokenInteractionDirection.Out ? 'icon 17px' : 'icon 11px'}
                color="labelSecondary"
                weight="bold"
              >
                {symbol}
              </Text>
              <Box flexDirection="row" alignItems="center" style={flexStyles}>
                <Text size="17pt" color="labelSecondary" weight="medium">
                  {currencyAmount}
                </Text>
                <Text size="17pt" ellipsizeMode="tail" numberOfLines={1} color="labelQuaternary" weight="medium" style={flexStyles}>
                  {asset.symbol}
                </Text>
              </Box>
            </Box>
          </Box>
          <Text size="17pt" color="labelSecondary" weight="medium">
            {nativeAmount.display}
          </Text>
        </Box>
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
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const { activeTabIndex, isExpanded } = useTabContext();

  const filteredTokenInteractions = useMemo(() => {
    if (activeTabIndex === 1) return buys;
    if (activeTabIndex === 2) return sells;

    return data;
  }, [activeTabIndex, data, buys, sells]);

  const listHeight = useDerivedValue(
    () => calculateContainerHeight(filteredTokenInteractions, isExpanded.value),
    [filteredTokenInteractions, isExpanded]
  );

  const loaderStyles = useAnimatedStyle(() => {
    const loaderHeight = DEFAULT_VISIBLE_ITEM_COUNT * ROW_HEIGHT + (DEFAULT_VISIBLE_ITEM_COUNT - 1) * ROW_PADDING;

    return {
      height: withTiming(isLoading && filteredTokenInteractions.length === 0 ? loaderHeight : 0, TIMING_CONFIGS.fastFadeConfig),
      opacity: withTiming(isLoading && filteredTokenInteractions.length === 0 ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
    };
  });

  const listStyles = useAnimatedStyle(() => {
    const clampedListHeight = clamp(listHeight.value, 0, listHeight.value);

    let heightAnimation: number | ReturnType<typeof withTiming> | ReturnType<typeof withSpring>;

    if (isExpanded.value) {
      heightAnimation = withDelay(ITEM_DELAY, withSpring(clampedListHeight, SPRING_CONFIGS.springConfig));
    } else {
      // NOTE: We can assume here that filteredTokenInteractions.length is greater than DEFAULT_VISIBLE_ITEM_COUNT
      // since the user is coming back from the isExpanded state
      heightAnimation = withDelay(
        ITEM_DELAY,
        withSpring(clampedListHeight, {
          dampingRatio: 0.9,
          stiffness: 150,
          overshootClamping: true,
          duration: Math.min(200, Math.max(filteredTokenInteractions.length - DEFAULT_VISIBLE_ITEM_COUNT, 1) * ITEM_DELAY),
        })
      );
    }

    return {
      height: heightAnimation,
      opacity: withTiming(filteredTokenInteractions.length !== 0 ? 1 : 0, TIMING_CONFIGS.fastFadeConfig),
    };
  });

  return (
    <Box style={[{ position: 'relative' }]}>
      {isLoading && filteredTokenInteractions.length === 0 && (
        <Box as={Animated.View} style={loaderStyles} gap={24}>
          {Array.from({ length: DEFAULT_VISIBLE_ITEM_COUNT }).map((_, index) => (
            <SkeletonRow key={index} width={DEVICE_WIDTH - 48} height={ROW_HEIGHT} />
          ))}
        </Box>
      )}

      {!isLoading && (
        <Box
          as={Animated.View}
          style={[listStyles, { gap: ROW_PADDING, overflow: 'hidden', paddingVertical: LIST_PADDING, marginVertical: -LIST_PADDING }]}
        >
          {filteredTokenInteractions.map((tokenInteraction, index) => (
            <ListItem
              key={index}
              index={index}
              item={tokenInteraction}
              nativeCurrency={nativeCurrency}
              listHeight={listHeight}
              isExpanded={isExpanded}
              totalItemCount={filteredTokenInteractions.length}
            />
          ))}
        </Box>
      )}

      <MoreButton tokenInteractions={filteredTokenInteractions} />
    </Box>
  );
});

const HistoryContent = memo(function HistoryContent({
  tokenInteractions,
  isLoadingTokenInteractions,
}: {
  tokenInteractions: TokenInteraction[];
  isLoadingTokenInteractions: boolean;
}) {
  const { accentColors } = useExpandedAssetSheetContext();

  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const isExpanded = useSharedValue(false);

  const buys = useMemo(() => {
    return tokenInteractions?.filter(interaction => interaction.type === TokenInteractionType.Bought);
  }, [tokenInteractions]);

  const sells = useMemo(() => {
    return tokenInteractions?.filter(interaction => interaction.type === TokenInteractionType.Sold);
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

  return (
    <Tabs
      tabs={TABS}
      accentColor={accentColors.color}
      isExpanded={isExpanded}
      activeTabIndex={activeTabIndex}
      setActiveTabIndex={setActiveTabIndex}
    >
      <ListData data={tokenInteractions} buys={buys} sells={sells} isLoading={isLoadingTokenInteractions} />
    </Tabs>
  );
});

export const HistorySection = memo(function HistorySection() {
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const accountAddress = useAccountAddress();
  const { basicAsset: asset } = useExpandedAssetSheetContext();

  const { data: tokenInteractions = [], isLoading: isLoadingTokenInteractions } = useTokenInteractions({
    chainID: asset.chainId,
    address: accountAddress,
    tokenAddress: asset.address,
    currency: nativeCurrency,
  });

  if (tokenInteractions.length === 0) {
    return null;
  }

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <CollapsibleSection
        content={<HistoryContent tokenInteractions={tokenInteractions} isLoadingTokenInteractions={isLoadingTokenInteractions} />}
        icon="􀐫"
        id={SectionId.HISTORY}
        primaryText="History"
      />
      <SheetSeparator />
    </Box>
  );
});
