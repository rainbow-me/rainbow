import { Fragment, memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScrollView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, withTiming, type SharedValue } from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Border, globalColors, Text, useColorMode } from '@/design-system';
import { InnerShadow } from '@/features/polymarket/components/InnerShadow';
import { getIconByLeagueId, LeagueIcon } from '@/features/polymarket/components/league-icon/LeagueIcon';
import { DEFAULT_SPORTS_LEAGUE_KEY } from '@/features/polymarket/constants';
import { useCategorySelector } from '@/features/polymarket/hooks/useCategorySelector';
import { LEAGUE_SELECTOR_ORDER, SPORT_LEAGUES } from '@/features/polymarket/leagues';
import { usePolymarketContext } from '@/features/polymarket/screens/polymarket-navigator/PolymarketContext';
import { usePolymarketSportsEventsStore, type PolymarketSportsLeagueId } from '@/features/polymarket/stores/polymarketSportsEventsStore';
import { opacity } from '@/framework/ui/utils/opacity';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';
import { deepFreeze } from '@/utils/deepFreeze';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { createOpacityPalette } from '@/worklets/colors';

type LeagueItem = {
  key: PolymarketSportsLeagueId;
  label: string;
  color: { dark: string; light: string };
};

const VERTICAL_PADDING = 4;
const CONTAINER_HEIGHT = 40 + VERTICAL_PADDING * 2;
const CONTAINER_WIDTH = DEVICE_WIDTH - 40;
const HORIZONTAL_PADDING = 4;
const LEAGUE_ITEMS: LeagueItem[] = [
  {
    key: DEFAULT_SPORTS_LEAGUE_KEY,
    label: 'All',
    color: { dark: opacity(globalColors.white100, 0.1), light: opacity(globalColors.white100, 0.5) },
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
  const {
    onItemLayout,
    onPress,
    selectedKey: selectedLeagueKey,
    skipInitialAnimation,
  } = useCategorySelector({
    containerWidth: CONTAINER_WIDTH,
    getItemKey: getLeagueKey,
    horizontalPadding: HORIZONTAL_PADDING,
    isDeeplinkSeed: key => key !== DEFAULT_SPORTS_LEAGUE_KEY,
    items: LEAGUE_ITEMS,
    scrollViewRef: leagueSelectorRef,
    selectStoreKey: state => state.selectedLeagueId,
    setStoreKey: setLeagueKey,
    store: usePolymarketSportsEventsStore,
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? opacity(globalColors.white100, 0.02) : opacity(globalColors.grey100, 0.03),
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Border
          borderRadius={CONTAINER_HEIGHT / 2}
          borderColor={{ custom: isDarkMode ? opacity('#F5F8FF', 0.08) : opacity(globalColors.grey100, 0.02) }}
          borderWidth={THICK_BORDER_WIDTH}
        />
        {!isDarkMode && (
          <InnerShadow blur={6} borderRadius={CONTAINER_HEIGHT / 2} color={opacity(globalColors.grey100, 0.03)} dx={0} dy={2} />
        )}
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollViewContentContainer}
        horizontal
        ref={leagueSelectorRef}
        showsHorizontalScrollIndicator={false}
        style={styles.scrollView}
      >
        {LEAGUE_ITEMS.map((league, index) => (
          <Fragment key={league.key}>
            <View onLayout={event => onItemLayout(event, index)}>
              <LeagueItemComponent
                league={league}
                onPress={onPress}
                selectedLeagueKey={selectedLeagueKey}
                skipInitialAnimation={skipInitialAnimation}
              />
            </View>
            {index < LEAGUE_ITEMS.length - 1 && (
              <View style={[styles.separator, { backgroundColor: opacity('#1A1A1A', isDarkMode ? 1 : 0.04) }]} />
            )}
          </Fragment>
        ))}
      </ScrollView>
    </View>
  );
});

// ============ League Item ================================================== //

type LeagueItemProps = {
  league: LeagueItem;
  onPress: (league: LeagueItem) => void;
  selectedLeagueKey: SharedValue<PolymarketSportsLeagueId>;
  skipInitialAnimation: SharedValue<boolean>;
};

const LeagueItemComponent = memo(function LeagueItemComponent({
  league,
  onPress,
  selectedLeagueKey,
  skipInitialAnimation,
}: LeagueItemProps) {
  const { isDarkMode } = useColorMode();
  const selectedColor = opacity(globalColors.white100, 0.5);

  const leagueKey = league.key;
  const accentColors = useMemo(() => createOpacityPalette(selectedColor, PALETTE_OPACITIES), [selectedColor]);
  const backgroundColor = isDarkMode ? accentColors.opacity8 : opacity(globalColors.white100, 0.5);

  const backgroundFillStyle = useMemo(
    () => ({
      backgroundColor: backgroundColor,
      borderRadius: CONTAINER_HEIGHT / 2,
    }),
    [backgroundColor]
  );

  const borderContainerStyle = useAnimatedStyle(() => {
    const target = selectedLeagueKey.value === leagueKey ? 1 : 0;
    return {
      opacity: skipInitialAnimation.value ? target : withTiming(target, TIMING_CONFIGS.buttonPressConfig),
    };
  });

  const iconLeagueId = useMemo(
    () => (league.key !== DEFAULT_SPORTS_LEAGUE_KEY && getIconByLeagueId(league.key) !== undefined ? league.key : undefined),
    [league.key]
  );

  return (
    <ButtonPressAnimation onPress={() => onPress(league)} scaleTo={0.88}>
      <Animated.View style={styles.itemContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, borderContainerStyle]}>
          <Border borderColor={{ custom: accentColors.opacity6 }} borderRadius={CONTAINER_HEIGHT / 2} borderWidth={THICKER_BORDER_WIDTH} />
          <View style={[StyleSheet.absoluteFill, backgroundFillStyle]} />
          {isDarkMode && <InnerShadow blur={16} borderRadius={CONTAINER_HEIGHT / 2} color={accentColors.opacity28} dx={0} dy={8} />}
        </Animated.View>
        {iconLeagueId && (
          <View style={styles.iconContainer}>
            <LeagueIcon leagueId={iconLeagueId} size={24} />
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

function getLeagueKey(league: LeagueItem): PolymarketSportsLeagueId {
  return league.key;
}

function setLeagueKey(key: PolymarketSportsLeagueId): void {
  usePolymarketSportsEventsStore.getState().setSelectedLeagueId(key);
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
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingVertical: VERTICAL_PADDING,
  },
  separator: {
    height: 20,
    width: 1,
  },
});
