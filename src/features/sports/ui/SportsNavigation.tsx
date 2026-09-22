import { memo, useCallback, useEffect, useMemo, type ReactElement, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { Canvas, Path, Shadow } from '@shopify/react-native-skia';
import { shallowEqual } from '@storesjs/stores';
import { BlurView } from 'react-native-blur-view';
import Animated, {
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { globalColors } from '@/design-system';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { getSquirclePath } from '@/design-system/layout/shapes';
import { getSportsDestinationKey, type SportsHost } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigation';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK } from '@/features/sports/ui/colors';
import { LiveIndicator } from '@/features/sports/ui/LiveIndicator';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import useDimensions from '@/hooks/useDimensions';
import { useLazyRef } from '@/hooks/useLazyRef';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH, THICKER_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

export const SportsHeader = memo(function SportsHeader({ host }: { host: SportsHost }): ReactElement {
  const { scope, parent, back, page } = sportsNavigationStores[host](
    s => ({ scope: s.scope, parent: s.parent, back: s.back, page: s.page }),
    shallowEqual
  );

  const title =
    scope?.name ?? i18n.t(page === 'live' ? i18n.l.sports.live : page === 'sports' ? i18n.l.sports.all_sports : i18n.l.sports.title);

  return (
    <View style={[styles.header, back ? styles.nestedHeader : undefined]}>
      {back ? (
        <View style={styles.back}>
          <ButtonPressAnimation onPress={() => sportsActions.goBack(host)} scaleTo={0.8} style={styles.backButton}>
            <TextIcon color="label" size="icon 16px" weight="heavy" containerSize={20}>
              {'􀆉'}
            </TextIcon>
          </ButtonPressAnimation>
        </View>
      ) : null}

      {scope ? (
        <SportsBadge scope={scope} size={44} />
      ) : page === 'live' ? (
        <Bleed vertical="8px">
          <LiveIndicator />
        </Bleed>
      ) : null}

      <View style={styles.headerText}>
        {parent ? (
          <Text color="labelQuaternary" size="15pt" weight="semibold" numberOfLines={1}>
            {parent.name}
          </Text>
        ) : null}

        <Text color="label" size={scope ? '20pt' : '30pt'} weight="heavy" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
});

export const SportsScopeBar = memo(function SportsScopeBar({ host, bottom }: { host: SportsHost; bottom: number }) {
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();

  const {
    categories,
    selectedCategory: selectedKey,
    searching,
  } = sportsNavigationStores[host](
    s => ({ categories: s.categories, selectedCategory: s.selectedCategory, searching: s.page === 'search' }),
    shallowEqual
  );

  const scopes = useSportsStore(s => s.catalog?.scopes);
  const positionsRef = useLazyRef(() => new Map<string, { x: number; width: number }>());
  const scroll = useAnimatedRef<Animated.ScrollView>();

  const contentWidth = useSharedValue(0);
  const scrollOffset = useSharedValue(0);

  const showSearch = host === 'main';
  const railWidth = width - 40 - (showSearch ? 54 : 0);

  const revealSelected = useCallback(
    (animated: boolean) => {
      const position = positionsRef.current.get(selectedKey);
      if (!position) return;

      runOnUI((itemX: number, itemWidth: number, animated: boolean) => {
        const maxOffset = Math.max(0, contentWidth.value - railWidth);
        const x = Math.max(0, Math.min(maxOffset, itemX - (railWidth - itemWidth) / 2));
        if (x !== scrollOffset.value) scrollTo(scroll, x, 0, animated);
      })(position.x, position.width, animated);
    },
    [contentWidth, positionsRef, railWidth, scroll, scrollOffset, selectedKey]
  );

  const onScroll = useAnimatedScrollHandler({
    onScroll: event => {
      scrollOffset.value = event.contentOffset.x;
    },
  });

  useEffect(() => {
    if (searching) scrollOffset.value = 0;
    else revealSelected(true);
  }, [revealSelected, scrollOffset, searching]);

  if (searching) return null;

  return (
    <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
      <ScopeSurface width={railWidth}>
        <MaskedView
          androidRenderingMode="software"
          style={styles.scrollMask}
          maskElement={<ScopeFadeMask contentWidth={contentWidth} scrollOffset={scrollOffset} width={railWidth} />}
        >
          <Animated.ScrollView
            ref={scroll}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.items}
            onContentSizeChange={width => {
              contentWidth.value = width;
              revealSelected(false);
            }}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {categories.map(destination => {
              const key = getSportsDestinationKey(destination);
              const selected = key === selectedKey;
              const label =
                destination.type === 'scope'
                  ? scopes?.[destination.scopeId]?.name
                  : i18n.t(destination.type === 'live' ? i18n.l.sports.live : i18n.l.sports.more);

              return (
                <View
                  key={key}
                  onLayout={({ nativeEvent: { layout } }) => {
                    positionsRef.current.set(key, { x: layout.x, width: layout.width });
                    if (selected) revealSelected(false);
                  }}
                >
                  <ButtonPressAnimation
                    onPress={() => sportsActions.selectDestination(host, destination)}
                    scaleTo={0.94}
                    style={styles.scopeButton}
                  >
                    <Text color="label" size="20pt" weight="heavy" style={selected ? undefined : { opacity: isDarkMode ? 0.4 : 0.3 }}>
                      {label}
                    </Text>
                  </ButtonPressAnimation>
                </View>
              );
            })}
          </Animated.ScrollView>
        </MaskedView>
      </ScopeSurface>

      {showSearch ? (
        <ButtonPressAnimation onPress={() => sportsActions.setSearch(host, '')} scaleTo={0.92}>
          <ScopeSurface width={46}>
            <View style={styles.searchButton}>
              <TextIcon color="label" size="icon 19px" weight="bold" containerSize={24}>
                {'􀊫'}
              </TextIcon>
            </View>
          </ScopeSurface>
        </ButtonPressAnimation>
      ) : null}
    </View>
  );
});

function ScopeFadeMask({
  contentWidth,
  scrollOffset,
  width,
}: {
  contentWidth: SharedValue<number>;
  scrollOffset: SharedValue<number>;
  width: number;
}) {
  const showLeft = useDerivedValue(() => scrollOffset.value > 0);
  const showRight = useDerivedValue(() => scrollOffset.value < Math.max(0, contentWidth.value - width));

  const leftCover = useAnimatedStyle(() => ({ opacity: withTiming(showLeft.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig) }));
  const rightCover = useAnimatedStyle(() => ({ opacity: withTiming(showRight.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig) }));

  return (
    <View style={styles.mask}>
      <View style={styles.maskEdge}>
        <EasingGradient
          startColor={globalColors.grey100}
          endColor={globalColors.grey100}
          startOpacity={0}
          endOpacity={1}
          startPosition="left"
          endPosition="right"
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.maskCover, leftCover]} />
      </View>

      <View style={styles.maskCenter} />

      <View style={styles.maskEdge}>
        <EasingGradient
          startColor={globalColors.grey100}
          endColor={globalColors.grey100}
          startOpacity={1}
          endOpacity={0}
          startPosition="left"
          endPosition="right"
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={[styles.maskCover, rightCover]} />
      </View>
    </View>
  );
}

function ScopeSurface({ children, width }: { children: ReactNode; width: number }) {
  const { isDarkMode } = useColorMode();

  const backgroundColor = Platform.OS === 'android' ? (isDarkMode ? '#070707' : globalColors.white100) : (isDarkMode ? black : white)(0.8);

  return (
    <View style={[styles.scopeShadow, isDarkMode ? styles.darkScopeShadow : styles.lightScopeShadow]}>
      <View style={[styles.scopeSurface, { width }, isDarkMode ? undefined : styles.tightScopeShadow]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scopeClip]}>
          {Platform.OS === 'ios' ? (
            <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={isDarkMode ? 9 : 7} style={StyleSheet.absoluteFill} />
          ) : null}
          <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
          {isDarkMode ? <ScopeInnerShadow width={width} /> : null}
        </View>

        <View style={[styles.scopeContent, styles.scopeClip]}>{children}</View>
        <Border
          borderRadius={32}
          borderWidth={isDarkMode ? THICKER_BORDER_WIDTH : THICK_BORDER_WIDTH}
          borderColor={{ custom: white(isDarkMode ? 0.03 : 1) }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

function ScopeInnerShadow({ width }: { width: number }) {
  const path = useMemo(() => getSquirclePath({ width, height: 46, borderRadius: 32 }), [width]);
  return (
    <Canvas style={{ width, height: 46 }}>
      <Path path={path}>
        <Shadow color={white(0.15)} blur={19.5} dx={0} dy={0} inner shadowOnly />
      </Path>
    </Canvas>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nestedHeader: { paddingLeft: 48 },
  back: {
    position: 'absolute',
    left: 4,
    top: '50%',
    marginTop: -22,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1, gap: 10 },
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 46,
    flexDirection: 'row',
    gap: 8,
  },
  scopeSurface: {
    height: 46,
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  scopeContent: { flex: 1 },
  scopeClip: {
    borderRadius: 32,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  scopeShadow: {
    borderRadius: 32,
    borderCurve: 'continuous',
  },
  darkScopeShadow: {
    shadowColor: SPORTS_BACKGROUND_COLOR_DARK,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 15,
    elevation: 10,
  },
  lightScopeShadow: {
    shadowColor: globalColors.grey100,
    shadowOpacity: 0.04,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  tightScopeShadow: {
    shadowColor: globalColors.grey100,
    shadowOpacity: 0.02,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  items: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 16,
  },
  scopeButton: { height: 46, justifyContent: 'center' },
  scrollMask: { flex: 1 },
  mask: { flex: 1, flexDirection: 'row' },
  maskEdge: { width: 36 },
  maskCenter: { flex: 1, backgroundColor: globalColors.grey100 },
  maskCover: { ...StyleSheet.absoluteFillObject, backgroundColor: globalColors.grey100 },
  searchButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
