import { memo, useCallback, useMemo, useRef } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ButtonPressAnimation } from '@/components/animations';
import { Border, globalColors, Text, useColorMode } from '@/design-system';
import { DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { LEAGUE_SELECTOR_ORDER, SPORT_LEAGUES } from '@/features/polymarket/leagues';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { getIconByLeagueId, LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { usePolymarketSportsEventsStore } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';
import { opacityWorklet } from '@/__swaps__/utils/swaps';

type LeagueKey = keyof typeof SPORT_LEAGUES;
type LeagueItemKey = LeagueKey | typeof DEFAULT_SPORTS_LEAGUE_KEY;
type LeagueItem = {
  key: LeagueItemKey;
  label: string;
  color: { dark: string; light: string };
};
type ItemLayout = { x: number; width: number };

const VERTICAL_PADDING = 4;
const CONTAINER_HEIGHT = 40 + VERTICAL_PADDING * 2;
const CONTAINER_WIDTH = DEVICE_WIDTH - 40;
const HORIZONTAL_PADDING = 4;
const LEAGUE_ITEMS: LeagueItem[] = [
  {
    key: DEFAULT_SPORTS_LEAGUE_KEY,
    label: 'All',
    color: { dark: opacityWorklet(globalColors.white100, 0.1), light: opacityWorklet(globalColors.white100, 0.5) },
  },
  ...LEAGUE_SELECTOR_ORDER.map<LeagueItem>(key => ({
    key,
    label: SPORT_LEAGUES[key].name,
    color: SPORT_LEAGUES[key].color,
  })),
];
const PALETTE_OPACITIES = deepFreeze([6, 8, 28]);
export const LEAGUE_SELECTOR_HEIGHT = CONTAINER_HEIGHT;

// ============ League Selector ============================================== //

export const PolymarketLeagueSelector = memo(function PolymarketLeagueSelector() {
  const { isDarkMode } = useColorMode();
  const { leagueSelectorRef } = usePolymarketContext();
  const itemLayouts = useRef<ItemLayout[]>([]);
  const didInitialScroll = useRef(false);

  const selectedLeagueKey = useSharedValue<LeagueItemKey>(usePolymarketSportsEventsStore.getState().selectedLeagueId as LeagueItemKey);

  const scrollToSelectedLeague = useCallback(() => {
    const index = LEAGUE_ITEMS.findIndex(league => league.key === selectedLeagueKey.value);
    const scrollX = calculateCenteredScrollX(itemLayouts.current, index);
    leagueSelectorRef.current?.scrollTo({ x: scrollX, y: 0, animated: false });
  }, [leagueSelectorRef, selectedLeagueKey]);

  const onItemLayout = useCallback(
    (event: LayoutChangeEvent, index: number) => {
      itemLayouts.current[index] = { x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width };
      if (!didInitialScroll.current && allItemsMeasured(itemLayouts.current)) {
        didInitialScroll.current = true;
        scrollToSelectedLeague();
      }
    },
    [scrollToSelectedLeague]
  );

  const onPress = useCallback(
    (league: LeagueItem) => {
      selectedLeagueKey.value = league.key;
      usePolymarketSportsEventsStore.getState().setSelectedLeagueId(league.key);
    },
    [selectedLeagueKey]
  );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? opacityWorklet(globalColors.white100, 0.02) : opacityWorklet(globalColors.grey100, 0.03),
        },
      ]}
    >
      <Border
        borderRadius={CONTAINER_HEIGHT / 2}
        borderColor={{ custom: isDarkMode ? opacityWorklet('#F5F8FF', 0.08) : opacityWorklet(globalColors.grey100, 0.02) }}
        borderWidth={THICK_BORDER_WIDTH}
      />
      {!isDarkMode && (
        <InnerShadow blur={6} borderRadius={CONTAINER_HEIGHT / 2} color={opacityWorklet(globalColors.grey100, 0.03)} dx={0} dy={2} />
      )}
      <ScrollView
        contentContainerStyle={styles.scrollViewContentContainer}
        horizontal
        ref={leagueSelectorRef}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {LEAGUE_ITEMS.map((league, index) => (
          <View key={league.key} onLayout={event => onItemLayout(event, index)}>
            <LeagueItemComponent league={league} onPress={onPress} selectedLeagueKey={selectedLeagueKey} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
});

// ============ League Item ================================================== //

type LeagueItemProps = {
  league: LeagueItem;
  onPress: (league: LeagueItem) => void;
  selectedLeagueKey: SharedValue<LeagueItemKey>;
};

const LeagueItemComponent = memo(function LeagueItemComponent({ league, onPress, selectedLeagueKey }: LeagueItemProps) {
  const { isDarkMode } = useColorMode();
  const selectedColor = isDarkMode ? league.color.dark : opacityWorklet(globalColors.white100, 0.5);

  const leagueKey = league.key;
  const accentColors = useMemo(() => createOpacityPalette(selectedColor, PALETTE_OPACITIES), [selectedColor]);
  const backgroundColor = isDarkMode ? accentColors.opacity8 : opacityWorklet(globalColors.white100, 0.5);

  const backgroundFillStyle = useMemo(
    () => ({
      backgroundColor: backgroundColor,
      borderRadius: CONTAINER_HEIGHT / 2,
    }),
    [backgroundColor]
  );

  const borderContainerStyle = useAnimatedStyle(() => ({
    opacity: selectedLeagueKey.value === leagueKey ? 1 : 0,
  }));

  const hasIcon = useMemo(() => league.key !== DEFAULT_SPORTS_LEAGUE_KEY && getIconByLeagueId(league.key) !== undefined, [league.key]);

  return (
    <ButtonPressAnimation onPress={() => onPress(league)} scaleTo={0.88}>
      <Animated.View style={styles.itemContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, borderContainerStyle]}>
          <Border borderColor={{ custom: accentColors.opacity6 }} borderRadius={CONTAINER_HEIGHT / 2} borderWidth={THICKER_BORDER_WIDTH} />
          <View style={[StyleSheet.absoluteFill, backgroundFillStyle]} />
          {isDarkMode && <InnerShadow blur={16} borderRadius={CONTAINER_HEIGHT / 2} color={accentColors.opacity28} dx={0} dy={8} />}
        </Animated.View>
        {hasIcon && (
          <View style={styles.iconContainer}>
            <LeagueIcon leagueId={league.key as LeagueKey} size={24} />
          </View>
        )}
        <Text align="center" color="label" size="17pt" weight="heavy">
          {league.label}
        </Text>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

// ============ Utilities ====================================================== //

function allItemsMeasured(layouts: ItemLayout[]): boolean {
  return layouts.filter(Boolean).length === LEAGUE_ITEMS.length;
}

function calculateCenteredScrollX(layouts: ItemLayout[], index: number): number {
  const layout = layouts[index];
  const lastLayout = layouts[layouts.length - 1];
  if (!layout || !lastLayout) return 0;

  const itemCenter = layout.x + layout.width / 2;
  const contentWidth = lastLayout.x + lastLayout.width + HORIZONTAL_PADDING;
  const maxScroll = Math.max(0, contentWidth - CONTAINER_WIDTH);

  return Math.min(Math.max(0, itemCenter - CONTAINER_WIDTH / 2), maxScroll);
}

// ============ Styles ========================================================= //

const styles = StyleSheet.create({
  container: {
    height: CONTAINER_HEIGHT,
    width: CONTAINER_WIDTH,
    zIndex: 10,
    borderRadius: CONTAINER_HEIGHT / 2,
    overflow: 'hidden',
  },
  iconContainer: {
    alignItems: 'center',
    height: 16,
    justifyContent: 'center',
    width: 16,
  },
  itemContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  scrollView: {
    height: CONTAINER_HEIGHT,
    width: CONTAINER_WIDTH,
  },
  scrollViewContentContainer: {
    gap: 2,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
});
