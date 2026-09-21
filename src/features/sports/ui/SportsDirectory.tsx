import { StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { hasCompetitionDirectory, type SportsHost } from '@/features/sports/core/browse';
import { getSportsDirectoryCounts } from '@/features/sports/core/sections';
import { getSportsAvailableGameIds, sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

export function SportsDirectory({ host, showHeading = false }: { host: SportsHost; showHeading?: boolean }) {
  const { isDarkMode } = useColorMode();
  const directory = useSportsStore(state => {
    const { destination, query } = state.hosts[host].request;
    const sports = state.catalog?.sports ?? [];
    const counts = getSportsDirectoryCounts({
      catalog: state.catalog,
      games: state.games,
      gameIds: getSportsAvailableGameIds(state),
    });
    if (query !== null) {
      const text = query.toLocaleLowerCase();
      const scopes = [...sports, ...sports.flatMap(sport => sport.competitions)];
      return {
        searching: true,
        competitions: false,
        rows: text
          ? scopes.filter(scope => scope.name.toLocaleLowerCase().includes(text)).map(scope => ({ ...scope, count: counts[scope.id] ?? 0 }))
          : [],
      };
    }
    if (destination.type === 'all')
      return { searching: false, competitions: false, rows: sports.map(sport => ({ ...sport, count: counts[sport.id] ?? 0 })) };
    if (destination.type !== 'scope' || !hasCompetitionDirectory(state.catalog, destination.scopeId)) return undefined;
    const competitions = sports.find(sport => sport.id === destination.scopeId)?.competitions ?? [];
    return {
      searching: false,
      competitions: true,
      rows: competitions.map(competition => ({ ...competition, count: counts[competition.id] ?? 0 })),
    };
  }, deepEqual);
  if (!directory?.rows.length) return null;

  return (
    <View style={styles.directory}>
      {directory.competitions && showHeading && (
        <View style={styles.heading}>
          <Text color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.sports.competitions)}
          </Text>
        </View>
      )}
      {directory.competitions && !showHeading && (
        <View style={[styles.separator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} />
      )}
      {directory.rows.map(scope => {
        const open = () =>
          directory.searching
            ? sportsActions.selectDestination(host, { type: 'scope', scopeId: scope.id })
            : sportsActions.openScope(host, scope.id);
        return (
          <View key={scope.id} accessible accessibilityRole="button" accessibilityLabel={scope.name} onAccessibilityTap={open}>
            <ButtonPressAnimation onPress={open} scaleTo={0.98}>
              <View style={[styles.row, directory.competitions && styles.competition]}>
                <SportsBadge scope={scope} size={directory.competitions ? 28 : 40} />
                <Text color="label" size={directory.competitions ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
                  {scope.name}
                </Text>
                <View style={styles.trailing}>
                  <View style={[styles.count, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
                    <Text color="labelSecondary" size="14pt" weight="heavy">
                      {scope.count}
                    </Text>
                    <Border
                      borderRadius={8}
                      borderWidth={4 / 3}
                      borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
                      enableInLightMode
                    />
                  </View>
                  <TextIcon
                    color={{ custom: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
                    size="15pt"
                    weight="heavy"
                    width={13}
                    height={10}
                  >
                    {'􀯻'}
                  </TextIcon>
                </View>
              </View>
            </ButtonPressAnimation>
            <View
              style={[
                styles.separator,
                {
                  marginLeft: directory.competitions ? 38 : 54,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  directory: { paddingHorizontal: 20 },
  heading: { paddingHorizontal: 4, paddingTop: 24, paddingBottom: 16 },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  competition: { minHeight: 56, gap: 10, paddingVertical: 14 },
  name: { flex: 1 },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  count: { height: 23, borderRadius: 8, borderCurve: 'continuous', paddingHorizontal: 7, justifyContent: 'center', alignItems: 'center' },
  separator: { height: 2 },
});
