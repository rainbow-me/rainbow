import { memo, useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
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
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { getSquirclePath } from '@/design-system/layout/shapes';
import { opacity } from '@/design-system/utils/opacity';
import {
  findScope,
  getSportsDestinationKey,
  getSportsNavigationRoot,
  getSportsParentDestination,
  type SportsDestination,
  type SportsHost,
} from '@/features/sports/core/browse';
import { sportsActions, useSportsStore, useSportsViewStore } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';

export const SportsHeader = memo(function SportsHeader({ host }: { host: SportsHost }) {
  const { isDarkMode } = useColorMode();
  const catalog = useSportsStore(state => state.catalog);
  const { destination, navigationRoot } = useSportsViewStore(
    state => ({
      destination: state.hosts[host].request.destination,
      navigationRoot: state.hosts[host].navigationRoot,
    }),
    shallowEqual
  );
  const red = useForegroundColor('red');
  const scope = destination.type === 'scope' ? findScope(catalog, destination.scopeId) : undefined;
  const parent = scope && catalog?.sports.find(sport => sport.competitions.some(competition => competition.id === scope.id));
  const back = getSportsParentDestination(catalog, destination, navigationRoot);
  const title =
    destination.type === 'live'
      ? i18n.t(i18n.l.sports.live)
      : destination.type === 'all'
        ? i18n.t(i18n.l.sports.all_sports)
        : (scope?.name ?? i18n.t(i18n.l.sports.title));

  return (
    <View style={[styles.header, back && styles.nestedHeader]} accessibilityRole="header">
      {back && (
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={i18n.t(i18n.l.button.go_back)}
          onAccessibilityTap={() => sportsActions.goBack(host)}
          style={styles.back}
        >
          <ButtonPressAnimation onPress={() => sportsActions.goBack(host)} scaleTo={0.8} style={styles.backButton}>
            <TextIcon color="label" size="icon 16px" weight="heavy" containerSize={20}>
              {'􀆉'}
            </TextIcon>
          </ButtonPressAnimation>
        </View>
      )}
      {scope ? (
        <SportsBadge scope={scope} size={44} />
      ) : destination.type === 'live' ? (
        <Bleed vertical="8px">
          <View style={[styles.liveRing, { borderColor: opacity(isDarkMode ? '#FF584D' : red, 0.3) }]}>
            <View style={[styles.liveDot, { backgroundColor: isDarkMode ? '#E65048' : red }]} />
          </View>
        </Bleed>
      ) : null}
      <View style={styles.headerText}>
        {parent && (
          <Text color="labelQuaternary" size="15pt" weight="semibold" numberOfLines={1}>
            {parent.name}
          </Text>
        )}
        <Text color="label" size={scope ? '20pt' : '30pt'} weight="heavy" numberOfLines={1}>
          {title}
        </Text>
      </View>
    </View>
  );
});

export const SportsScopeBar = memo(function SportsScopeBar({ host, bottom }: { host: SportsHost; bottom: number }) {
  const catalog = useSportsStore(state => state.catalog);
  const { navigationRoot, searching } = useSportsViewStore(
    state => ({
      navigationRoot: state.hosts[host].navigationRoot,
      searching: state.hosts[host].request.query !== null,
    }),
    shallowEqual
  );
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const scroll = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const positions = useRef(new Map<string, { x: number; width: number }>());
  const showSearch = host === 'main';
  const railWidth = width - 40 - (showSearch ? 54 : 0);
  const selectedKey = getSportsDestinationKey(getSportsNavigationRoot(catalog, navigationRoot));
  const scopeIds = catalog?.prominentScopeIds ?? [];
  const items: { destination: SportsDestination; label: string }[] = [{ destination: { type: 'live' }, label: i18n.t(i18n.l.sports.live) }];
  for (const scopeId of scopeIds) {
    const scope = findScope(catalog, scopeId);
    if (scope) items.push({ destination: { type: 'scope', scopeId }, label: scope.name });
  }
  items.push({ destination: { type: 'all' }, label: i18n.t(i18n.l.sports.more) });

  const revealSelected = useCallback(
    (animated: boolean) => {
      const position = positions.current.get(selectedKey);
      if (!position) return;
      runOnUI((itemX: number, itemWidth: number, animated: boolean) => {
        const maxOffset = Math.max(0, contentWidth.value - railWidth);
        const x = Math.max(0, Math.min(maxOffset, itemX - (railWidth - itemWidth) / 2));
        if (x !== scrollOffset.value) scrollTo(scroll, x, 0, animated);
      })(position.x, position.width, animated);
    },
    [contentWidth, railWidth, scroll, scrollOffset, selectedKey]
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
            {items.map(item => {
              const key = getSportsDestinationKey(item.destination);
              const selected = key === selectedKey;
              const select = () => sportsActions.selectDestination(host, item.destination);
              return (
                <View
                  key={key}
                  accessible
                  accessibilityRole="tab"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onAccessibilityTap={select}
                  onLayout={({ nativeEvent: { layout } }) => {
                    positions.current.set(key, { x: layout.x, width: layout.width });
                    if (selected) revealSelected(false);
                  }}
                >
                  <ButtonPressAnimation onPress={select} scaleTo={0.94} style={styles.scopeButton}>
                    <Text color="label" size="20pt" weight="heavy" style={!selected && { opacity: isDarkMode ? 0.4 : 0.3 }}>
                      {item.label}
                    </Text>
                  </ButtonPressAnimation>
                </View>
              );
            })}
          </Animated.ScrollView>
        </MaskedView>
      </ScopeSurface>
      {showSearch && (
        <View
          accessible
          accessibilityRole="button"
          accessibilityLabel={i18n.t(i18n.l.sports.search)}
          onAccessibilityTap={() => sportsActions.setSearch(host, '')}
        >
          <ButtonPressAnimation onPress={() => sportsActions.setSearch(host, '')} scaleTo={0.92}>
            <ScopeSurface width={46}>
              <View style={styles.searchButton}>
                <TextIcon color="label" size="icon 19px" weight="bold" containerSize={24}>
                  {'􀊫'}
                </TextIcon>
              </View>
            </ScopeSurface>
          </ButtonPressAnimation>
        </View>
      )}
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
  const leftCover = useAnimatedStyle(() => ({
    opacity: withTiming(showLeft.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig),
  }));
  const rightCover = useAnimatedStyle(() => ({
    opacity: withTiming(showRight.value ? 0 : 1, TIMING_CONFIGS.fastFadeConfig),
  }));
  return (
    <View style={styles.mask}>
      <View style={styles.maskEdge}>
        <EasingGradient
          startColor="#000000"
          endColor="#000000"
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
          startColor="#000000"
          endColor="#000000"
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
  const backgroundColor =
    Platform.OS === 'android' ? (isDarkMode ? '#070707' : '#FFFFFF') : isDarkMode ? 'rgba(6,6,6,0.811)' : 'rgba(255,255,255,0.8)';
  return (
    <View style={[styles.scopeShadow, isDarkMode ? styles.darkScopeShadow : styles.lightScopeShadow]}>
      <View style={[styles.scopeSurface, { width }, !isDarkMode && styles.tightScopeShadow]}>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.scopeClip]}>
          {Platform.OS === 'ios' && (
            <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={isDarkMode ? 9 : 7} style={StyleSheet.absoluteFill} />
          )}
          <View style={[StyleSheet.absoluteFill, { backgroundColor }]} />
          {isDarkMode && <ScopeInnerShadow width={width} />}
        </View>
        <View style={[styles.scopeContent, styles.scopeClip]}>{children}</View>
        <Border
          borderRadius={32}
          borderWidth={isDarkMode ? 5 / 3 : 4 / 3}
          borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF' }}
          enableInLightMode
        />
      </View>
    </View>
  );
}

function ScopeInnerShadow({ width }: { width: number }) {
  const path = useMemo(() => getSquirclePath({ width, height: 46, borderRadius: 32 }), [width]);
  return (
    <Canvas style={{ width: Math.ceil(width), height: 46 }}>
      <Path path={path}>
        <Shadow color="rgba(255,255,255,0.15)" blur={19.5} dx={0} dy={0} inner shadowOnly />
      </Path>
    </Canvas>
  );
}

const RAIL_PADDING = 16;
const FADE_WIDTH = 36;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nestedHeader: { paddingLeft: 48 },
  back: { position: 'absolute', left: 4, top: '50%', marginTop: -22 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 10 },
  liveRing: { width: 28, height: 28, borderRadius: 14, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  bar: { position: 'absolute', left: 20, right: 20, height: 46, flexDirection: 'row', gap: 8 },
  scopeSurface: { height: 46, borderRadius: 32, borderCurve: 'continuous' },
  scopeContent: { flex: 1 },
  scopeClip: { borderRadius: 32, borderCurve: 'continuous', overflow: 'hidden' },
  scopeShadow: { borderRadius: 32, borderCurve: 'continuous', shadowColor: '#000000', shadowOpacity: 0.04 },
  darkScopeShadow: { shadowOffset: { width: 0, height: -4 }, shadowRadius: 20, elevation: 10 },
  lightScopeShadow: { shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 3 },
  tightScopeShadow: { shadowColor: '#000000', shadowOpacity: 0.02, shadowOffset: { width: 0, height: 2 }, shadowRadius: 3 },
  items: { alignItems: 'center', paddingHorizontal: RAIL_PADDING, gap: 16 },
  scopeButton: { height: 46, justifyContent: 'center' },
  scrollMask: { flex: 1 },
  mask: { flex: 1, flexDirection: 'row' },
  maskEdge: { width: FADE_WIDTH },
  maskCenter: { flex: 1, backgroundColor: '#000000' },
  maskCover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  searchButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
