import { StyleSheet, View } from 'react-native';

import { deepEqual } from '@storesjs/stores';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Text, TextIcon } from '@/design-system';
import { hasCompetitionDirectory, type SportsHost } from '@/features/sports/core/browse';
import { getSportsDirectoryCounts } from '@/features/sports/core/sections';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsImage } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

export function SportsDirectory({ host }: { host: SportsHost }) {
  const directory = useSportsStore(state => {
    const { destination, query } = state.hosts[host].request;
    const sports = state.catalog?.sports ?? [];
    const counts = getSportsDirectoryCounts({
      catalog: state.catalog,
      games: state.games,
      gameIds: [...(state.hosts.main.result?.gameIds ?? []), ...(state.hosts.predictions.result?.gameIds ?? [])],
    });
    if (query !== null) {
      const text = query.toLocaleLowerCase();
      const scopes = [...sports, ...sports.flatMap(sport => sport.competitions)];
      return {
        competitions: false,
        rows: text
          ? scopes.filter(scope => scope.name.toLocaleLowerCase().includes(text)).map(scope => ({ ...scope, count: counts[scope.id] ?? 0 }))
          : [],
      };
    }
    if (destination.type === 'all') return { competitions: false, rows: sports.map(sport => ({ ...sport, count: counts[sport.id] ?? 0 })) };
    if (destination.type !== 'scope' || !hasCompetitionDirectory(state.catalog, destination.scopeId)) return undefined;
    const competitions = sports.find(sport => sport.id === destination.scopeId)?.competitions ?? [];
    return { competitions: true, rows: competitions.map(competition => ({ ...competition, count: counts[competition.id] ?? 0 })) };
  }, deepEqual);
  if (!directory?.rows.length) return null;

  return (
    <View style={styles.directory}>
      {directory.competitions && (
        <View style={styles.heading}>
          <Text color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.sports.competitions)}
          </Text>
        </View>
      )}
      {directory.rows.map(scope => (
        <ButtonPressAnimation
          key={scope.id}
          onPress={() => sportsActions.selectDestination(host, { type: 'scope', scopeId: scope.id })}
          scaleTo={0.98}
        >
          <View style={[styles.row, directory.competitions && styles.competition]}>
            <SportsImage imageUrl={scope.imageUrl} name={scope.name} size={directory.competitions ? 28 : 40} />
            <Text color="label" size={directory.competitions ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
              {scope.name}
            </Text>
            <View style={styles.count}>
              <Text color="labelSecondary" size="13pt" weight="heavy" tabularNumbers>
                {scope.count}
              </Text>
            </View>
            <TextIcon color="labelQuaternary" size="13pt" weight="heavy">
              {'􀆊'}
            </TextIcon>
          </View>
        </ButtonPressAnimation>
      ))}
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
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(128,128,128,0.06)',
  },
  competition: { minHeight: 56, gap: 10, paddingVertical: 14 },
  name: { flex: 1 },
  count: { borderRadius: 6, backgroundColor: 'rgba(128,128,128,0.1)', paddingHorizontal: 4, paddingVertical: 4 },
});
