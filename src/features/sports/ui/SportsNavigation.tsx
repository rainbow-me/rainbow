import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'react-native-blur-view';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { opacity } from '@/design-system/utils/opacity';
import { findScope, type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import { SportsSurface } from '@/features/sports/ui/SportsSurface';
import useDimensions from '@/hooks/useDimensions';
import * as i18n from '@/languages';

export const SportsHeader = memo(function SportsHeader({ host }: { host: SportsHost }) {
  const { isDarkMode } = useColorMode();
  const { catalog, destination } = useSportsStore(
    state => ({ catalog: state.catalog, destination: state.hosts[host].request.destination }),
    deepEqual
  );
  const red = useForegroundColor('red');
  const scope = destination.type === 'scope' ? findScope(catalog, destination.scopeId) : undefined;
  const parent = scope && catalog?.sports.find(sport => sport.competitions.some(competition => competition.id === scope.id));
  const title =
    destination.type === 'live'
      ? i18n.t(i18n.l.sports.live)
      : destination.type === 'all'
        ? i18n.t(i18n.l.sports.all_sports)
        : (scope?.name ?? i18n.t(i18n.l.sports.title));

  return (
    <View style={styles.header} accessibilityRole="header">
      {scope ? (
        <SportsImage imageUrl={scope.imageUrl} name={scope.name} color={scope.color} decoration="badge" size={44} />
      ) : destination.type === 'live' ? (
        <View style={[styles.liveRing, { borderColor: opacity(isDarkMode ? '#FF584D' : red, 0.3) }]}>
          <View style={[styles.liveDot, { backgroundColor: isDarkMode ? '#E65048' : red }]} />
        </View>
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
  const { catalog, destination, searching } = useSportsStore(
    state => ({
      catalog: state.catalog,
      destination: state.hosts[host].request.destination,
      searching: state.hosts[host].request.query !== null,
    }),
    deepEqual
  );
  const { isDarkMode } = useColorMode();
  const { width } = useDimensions();
  const scroll = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const positions = useRef(new Map<string, { x: number; width: number }>());
  const railWidth = width - 94;
  const selectedKey = destinationKey(destination);
  const scopeIds = catalog?.prominentScopeIds ?? [];
  const selectedScope = destination.type === 'scope' && !scopeIds.includes(destination.scopeId) ? destination.scopeId : undefined;
  const items: { destination: SportsDestination; label: string }[] = [{ destination: { type: 'live' }, label: i18n.t(i18n.l.sports.live) }];
  for (const scopeId of selectedScope ? [selectedScope, ...scopeIds] : scopeIds) {
    const scope = findScope(catalog, scopeId);
    if (scope) items.push({ destination: { type: 'scope', scopeId }, label: scope.name });
  }
  items.push({ destination: { type: 'all' }, label: i18n.t(i18n.l.sports.more) });

  const revealSelected = useCallback(
    (animated: boolean) => {
      const position = positions.current.get(selectedKey);
      if (!position) return;
      const minOffset = position.x + position.width - railWidth + FADE_WIDTH;
      const maxOffset = position.x - RAIL_PADDING;
      const x = Math.max(0, Math.min(maxOffset, Math.max(minOffset, scrollOffset.current)));
      if (x !== scrollOffset.current) scroll.current?.scrollTo({ x, animated });
    },
    [railWidth, selectedKey]
  );
  useEffect(() => {
    if (searching) scrollOffset.current = 0;
    else revealSelected(true);
  }, [revealSelected, searching]);

  if (searching) return null;
  return (
    <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
      <ScopeSurface width={railWidth}>
        <ScrollView
          ref={scroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.items}
          onScroll={({ nativeEvent }) => {
            scrollOffset.current = nativeEvent.contentOffset.x;
          }}
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
        </ScrollView>
        <LinearGradient
          colors={isDarkMode ? ['rgba(13,13,13,0)', 'rgba(13,13,13,0.92)'] : ['rgba(255,255,255,0)', '#FFFFFF']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          locations={[0, 0.644]}
          pointerEvents="none"
          style={styles.fade}
        />
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

const styles = StyleSheet.create({
  header: { minHeight: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1, gap: 10 },
  liveRing: { width: 28, height: 28, borderRadius: 14, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  bar: { position: 'absolute', left: 20, right: 20, height: 46, flexDirection: 'row', gap: 8 },
  items: { alignItems: 'center', paddingLeft: RAIL_PADDING, paddingRight: FADE_WIDTH, gap: 16 },
  scopeButton: { height: 46, justifyContent: 'center' },
  fade: { position: 'absolute', right: 0, top: 0, bottom: 0, width: FADE_WIDTH },
  searchButton: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
