import { StyleSheet, View } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsBrowseStores } from '@/features/sports/data/sportsBrowse';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';

export function SportsDirectory({ host, showHeading = false }: { host: SportsHost; showHeading?: boolean }) {
  const { isDarkMode } = useColorMode();
  const scopeIds = sportsBrowseStores[host](state => state.directory.scopeIds);
  const showCompetitions = sportsBrowseStores[host](state => state.directory.type === 'competitions');
  if (!scopeIds.length) return null;

  return (
    <View style={styles.directory}>
      {showCompetitions && showHeading && (
        <View style={styles.heading}>
          <Text color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.sports.competitions)}
          </Text>
        </View>
      )}
      {showCompetitions && !showHeading && (
        <View style={[styles.separator, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]} />
      )}
      {scopeIds.map(scopeId => (
        <DirectoryRow key={scopeId} scopeId={scopeId} host={host} competition={showCompetitions} />
      ))}
    </View>
  );
}

function DirectoryRow({ scopeId, host, competition }: { scopeId: string; host: SportsHost; competition: boolean }) {
  const { isDarkMode } = useColorMode();
  const scope = useSportsStore(state => state.catalog?.scopes[scopeId]);
  if (!scope) return null;
  const open = () => sportsActions.openScope(host, scopeId);
  return (
    <View accessible accessibilityRole="button" accessibilityLabel={scope.name} onAccessibilityTap={open}>
      <ButtonPressAnimation onPress={open} scaleTo={0.98}>
        <View style={[styles.row, competition && styles.competition]}>
          <SportsBadge scope={scope} size={competition ? 28 : 40} />
          <Text color="label" size={competition ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
            {scope.name}
          </Text>
          <View style={styles.trailing}>
            <DirectoryCount scopeId={scope.id} />
            <TextIcon
              color={{ custom: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
              size="icon 15px"
              weight="heavy"
              containerSize={16}
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
            marginLeft: competition ? 38 : 54,
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
          },
        ]}
      />
    </View>
  );
}

function DirectoryCount({ scopeId }: { scopeId: string }) {
  const { isDarkMode } = useColorMode();
  const count = useSportsStore(state => state.counts[scopeId] ?? 0);
  return (
    <View style={[styles.count, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }]}>
      <Text color="labelSecondary" size="14pt" weight="heavy">
        {count}
      </Text>
      <Border
        borderRadius={8}
        borderWidth={4 / 3}
        borderColor={{ custom: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }}
        enableInLightMode
      />
    </View>
  );
}

const styles = StyleSheet.create({
  directory: { paddingHorizontal: 20 },
  heading: {
    paddingHorizontal: 4,
    paddingTop: 24,
    paddingBottom: 16,
  },
  row: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  competition: {
    minHeight: 56,
    gap: 10,
    paddingVertical: 14,
  },
  name: { flex: 1 },
  trailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  count: {
    height: 23,
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: { height: 2 },
});
