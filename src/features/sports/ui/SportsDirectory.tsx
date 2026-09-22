import { StyleSheet, View } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { useColorMode } from '@/design-system/color/ColorMode';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigation';
import { sportsActions, useSportsStore } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

export function SportsDirectory({ host, showHeading = false }: { host: SportsHost; showHeading?: boolean }) {
  const { isDarkMode } = useColorMode();

  const scopeIds = sportsNavigationStores[host](s => s.directoryIds);
  const showCompetitions = sportsNavigationStores[host](s => s.page === 'competitions');

  if (!scopeIds.length) return null;

  return (
    <View style={styles.directory}>
      {showCompetitions && showHeading ? (
        <View style={styles.heading}>
          <Text color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.sports.competitions)}
          </Text>
        </View>
      ) : null}

      {showCompetitions && !showHeading ? (
        <View style={[styles.separator, { backgroundColor: (isDarkMode ? white : black)(0.04) }]} />
      ) : null}

      {scopeIds.map(scopeId => (
        <DirectoryRow key={scopeId} scopeId={scopeId} host={host} competition={showCompetitions} />
      ))}
    </View>
  );
}

function DirectoryRow({ scopeId, host, competition }: { scopeId: string; host: SportsHost; competition: boolean }) {
  const { isDarkMode } = useColorMode();
  const scope = useSportsStore(s => s.catalog?.scopes[scopeId]);

  if (!scope) return null;

  return (
    <>
      <ButtonPressAnimation onPress={() => sportsActions.openScope(host, scopeId)} scaleTo={0.98}>
        <View style={[styles.row, competition ? styles.competition : undefined]}>
          <SportsBadge scope={scope} size={competition ? 28 : 40} />

          <Text color="label" size={competition ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
            {scope.name}
          </Text>

          <View style={styles.trailing}>
            <DirectoryCount scopeId={scope.id} />
            <TextIcon color={{ custom: (isDarkMode ? white : black)(0.3) }} size="icon 15px" weight="heavy" containerSize={16}>
              {'􀯻'}
            </TextIcon>
          </View>
        </View>
      </ButtonPressAnimation>

      <View style={[styles.separator, { marginLeft: competition ? 38 : 54, backgroundColor: (isDarkMode ? white : black)(0.04) }]} />
    </>
  );
}

function DirectoryCount({ scopeId }: { scopeId: string }) {
  const { isDarkMode } = useColorMode();
  const count = useSportsStore(s => s.counts[scopeId] ?? 0);

  return (
    <View style={[styles.count, { backgroundColor: (isDarkMode ? white : black)(0.03) }]}>
      <Text color="labelSecondary" size="13pt" weight="heavy">
        {count}
      </Text>
      <Border
        borderRadius={9}
        borderWidth={THICK_BORDER_WIDTH}
        borderColor={{ custom: isDarkMode ? white(0.06) : black(0.04) }}
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
    height: 24,
    minWidth: 24,
    borderRadius: 9,
    borderCurve: 'continuous',
    paddingHorizontal: 7,
    justifyContent: 'center',
    alignItems: 'center',
  },
  separator: { height: 2 },
});
