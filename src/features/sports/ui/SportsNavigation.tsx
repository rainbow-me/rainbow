import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { deepEqual } from '@storesjs/stores';
import { BlurView } from 'react-native-blur-view';
import Animated, {
  interpolate,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { DEFAULT_SCROLL_FADE_DISTANCE } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Bleed } from '@/design-system/components/Bleed/Bleed';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { opacity } from '@/design-system/utils/opacity';
import {
  findScope,
  getSportsNavigationRoot,
  getSportsParentDestination,
  type SportsDestination,
  type SportsHost,
} from '@/features/sports/core/browse';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';

export const SportsHeader = memo(function SportsHeader({ host }: { host: SportsHost }) {
  const { isDarkMode } = useColorMode();
  const { catalog, destination, navigationRoot } = useSportsStore(
    state => ({
      catalog: state.catalog,
      destination: state.hosts[host].request.destination,
      navigationRoot: state.hosts[host].navigationRoot,
    }),
    deepEqual
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
  const { catalog, navigationRoot, searching } = useSportsStore(
    state => ({
      catalog: state.catalog,
      navigationRoot: state.hosts[host].navigationRoot,
      searching: state.hosts[host].request.query !== null,
    }),
    deepEqual
  );
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const scroll = useAnimatedRef<Animated.ScrollView>();
  const scrollOffset = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const positions = useRef(new Map<string, { x: number; width: number }>());
  const railWidth = width - 94;
  const selectedKey = destinationKey(getSportsNavigationRoot(catalog, navigationRoot));
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
              const key = destinationKey(item.destination);
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
  const leftCover = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, DEFAULT_SCROLL_FADE_DISTANCE], [1, 0], 'clamp'),
  }));
  const rightCover = useAnimatedStyle(() => ({
    opacity: interpolate(contentWidth.value - width - scrollOffset.value, [0, DEFAULT_SCROLL_FADE_DISTANCE], [1, 0], 'clamp'),
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
          style={[StyleSheet.absoluteFill, { left: FADE_EDGE_INSET }]}
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
          style={[StyleSheet.absoluteFill, { right: FADE_EDGE_INSET }]}
        />
        <Animated.View style={[styles.maskCover, rightCover]} />
      </View>
    </View>
  );
}

function ScopeSurface({ children, width }: { children: ReactNode; width: number }) {
  const { isDarkMode } = useColorMode();
  return (
    <SportsSurface
      clipContent
      borderRadius={32}
      color={Platform.OS === 'android' ? (isDarkMode ? '#070707' : '#FFFFFF') : isDarkMode ? 'rgba(6,6,6,0.811)' : 'rgba(255,255,255,0.8)'}
      borderColor={isDarkMode ? 'rgba(255,255,255,0.03)' : '#FFFFFF'}
      borderWidth={isDarkMode ? 5 / 3 : 4 / 3}
      shadows={isDarkMode ? DARK_SHADOWS : LIGHT_SHADOWS}
      innerShadow={isDarkMode ? INNER_SHADOW : undefined}
      backdrop={
        Platform.OS === 'ios' ? (
          <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={isDarkMode ? 9 : 7} style={StyleSheet.absoluteFill} />
        ) : undefined
      }
      style={{ width, height: 46 }}
    >
      {children}
    </SportsSurface>
  );
}

function destinationKey(destination: SportsDestination): string {
  return destination.type === 'scope' ? `scope:${destination.scopeId}` : destination.type;
}

const DARK_SHADOWS = [{ color: 'rgba(0,0,0,0.04)', blur: 20, dx: 0, dy: -4 }];
const LIGHT_SHADOWS = [
  { color: 'rgba(0,0,0,0.02)', blur: 3, dx: 0, dy: 2 },
  { color: 'rgba(0,0,0,0.04)', blur: 6, dx: 0, dy: 4 },
];
const INNER_SHADOW = { color: 'rgba(255,255,255,0.15)', blur: 19.5, dx: 0, dy: 0 };
const RAIL_PADDING = 16;
const FADE_WIDTH = 67;
const FADE_EDGE_INSET = 24;

const styles = StyleSheet.create({
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  nestedHeader: { paddingLeft: 48 },
  back: { position: 'absolute', left: 4, top: '50%', marginTop: -22 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: 10 },
  liveRing: { width: 28, height: 28, borderRadius: 14, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  bar: { position: 'absolute', left: 20, right: 20, height: 46, flexDirection: 'row', gap: 8 },
  items: { alignItems: 'center', paddingHorizontal: RAIL_PADDING, gap: 16 },
  scopeButton: { height: 46, justifyContent: 'center' },
  scrollMask: { flex: 1 },
  mask: { flex: 1, flexDirection: 'row' },
  maskEdge: { width: FADE_WIDTH },
  maskCenter: { flex: 1, backgroundColor: '#000000' },
  maskCover: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  searchButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
