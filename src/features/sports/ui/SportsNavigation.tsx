import { memo, useEffect, useRef } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'react-native-blur-view';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { Text } from '@/design-system/components/Text/Text';
import { opacity } from '@/design-system/utils/opacity';
import { findScope, type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

export const SportsHeader = memo(function SportsHeader({ host }: { host: SportsHost }) {
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
        <SportsImage imageUrl={scope.imageUrl} name={scope.name} size={44} />
      ) : destination.type === 'live' ? (
        <View style={[styles.liveRing, { borderColor: opacity(red, 0.34) }]}>
          <View style={[styles.liveDot, { backgroundColor: red }]} />
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
  const scroll = useRef<ScrollView>(null);
  const positions = useRef(new Map<string, number>());
  const selectedKey = destinationKey(destination);
  const scopeIds = catalog?.prominentScopeIds ?? [];
  const selectedScope = destination.type === 'scope' && !scopeIds.includes(destination.scopeId) ? destination.scopeId : undefined;
  const items: { destination: SportsDestination; label: string }[] = [{ destination: { type: 'live' }, label: i18n.t(i18n.l.sports.live) }];
  for (const scopeId of selectedScope ? [selectedScope, ...scopeIds] : scopeIds) {
    const scope = findScope(catalog, scopeId);
    if (scope) items.push({ destination: { type: 'scope', scopeId }, label: scope.name });
  }
  items.push({ destination: { type: 'all' }, label: i18n.t(i18n.l.sports.more) });

  useEffect(() => {
    const x = positions.current.get(selectedKey);
    if (x !== undefined) scroll.current?.scrollTo({ x: Math.max(0, x - 16), animated: true });
  }, [selectedKey, searching]);

  if (searching) return null;
  const surface = isDarkMode ? styles.darkSurface : styles.lightSurface;

  return (
    <View style={[styles.bar, { bottom }]} pointerEvents="box-none">
      <View style={[styles.rail, styles.surface, surface]}>
        <ScopeBackground />
        <ScrollView ref={scroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.items}>
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
                  positions.current.set(key, layout.x);
                  if (selected) scroll.current?.scrollTo({ x: Math.max(0, layout.x - 16), animated: false });
                }}
              >
                <ButtonPressAnimation onPress={select} scaleTo={0.94} style={styles.scopeButton}>
                  <Text color="label" size="20pt" weight="heavy" style={!selected && styles.inactive}>
                    {item.label}
                  </Text>
                </ButtonPressAnimation>
              </View>
            );
          })}
        </ScrollView>
      </View>
      <View
        accessible
        accessibilityRole="button"
        accessibilityLabel={i18n.t(i18n.l.sports.search)}
        onAccessibilityTap={() => sportsActions.setSearch(host, '')}
      >
        <ButtonPressAnimation onPress={() => sportsActions.setSearch(host, '')} scaleTo={0.92}>
          <View style={[styles.searchButton, styles.surface, surface]}>
            <ScopeBackground />
            <Text color="label" size="icon 23px" weight="bold" align="center">
              􀊫
            </Text>
          </View>
        </ButtonPressAnimation>
      </View>
    </View>
  );
});

function ScopeBackground() {
  const { isDarkMode } = useColorMode();
  return (
    <>
      {Platform.OS === 'ios' && <BlurView blurStyle={isDarkMode ? 'dark' : 'light'} blurIntensity={9} style={StyleSheet.absoluteFill} />}
      {isDarkMode && <LinearGradient colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)']} style={StyleSheet.absoluteFill} />}
    </>
  );
}

function destinationKey(destination: SportsDestination): string {
  return destination.type === 'scope' ? `scope:${destination.scopeId}` : destination.type;
}

const styles = StyleSheet.create({
  header: { minHeight: 44, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerText: { flex: 1, gap: 10 },
  liveRing: { width: 28, height: 28, borderRadius: 14, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  liveDot: { width: 8, height: 8, borderRadius: 4 },
  bar: { position: 'absolute', left: 20, right: 20, height: 46, flexDirection: 'row', gap: 8 },
  rail: { flex: 1 },
  surface: { borderRadius: 23, overflow: 'hidden', borderWidth: 5 / 3 },
  darkSurface: {
    backgroundColor: 'rgba(13,13,13,0.92)',
    borderColor: 'rgba(255,255,255,0.03)',
  },
  lightSurface: { backgroundColor: 'rgba(255,255,255,0.9)', borderColor: '#FFFFFF' },
  items: { alignItems: 'center', paddingHorizontal: 14, gap: 16 },
  scopeButton: { height: 42 + 2 / 3, justifyContent: 'center' },
  inactive: { opacity: 0.4 },
  searchButton: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
});
