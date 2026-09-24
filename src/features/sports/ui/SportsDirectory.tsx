import { memo, type ReactElement } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { black, white } from '@/worklets/colors';

export const SportsDirectoryRow = memo(function SportsDirectoryRow({
  scope,
  host,
  competition,
  isDarkMode,
  style,
}: {
  scope: SportsScope;
  host: SportsHost;
  competition: boolean;
  isDarkMode: boolean;
  style?: ViewStyle;
}): ReactElement {
  return (
    <View style={[styles.directory, style]}>
      <ButtonPressAnimation onPress={() => sportsNavigationStores[host].getState().open(scope.id)} scaleTo={0.98}>
        <View style={[styles.row, competition ? styles.competition : undefined]}>
          <SportsBadge isDarkMode={isDarkMode} scope={scope} size={competition ? 28 : 40} />

          <Text color="label" size={competition ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
            {scope.name}
          </Text>

          <TextIcon color={{ custom: (isDarkMode ? white : black)(0.3) }} size="icon 15px" weight="heavy" containerSize={16}>
            {'􀯻'}
          </TextIcon>
        </View>
      </ButtonPressAnimation>

      <View style={[styles.separator, { marginLeft: competition ? 38 : 54, backgroundColor: (isDarkMode ? white : black)(0.04) }]} />
    </View>
  );
});

export function SportsDirectoryHeading({ showTitle, isDarkMode }: { showTitle: boolean; isDarkMode: boolean }): ReactElement {
  return (
    <View style={styles.directory}>
      {showTitle ? (
        <View style={styles.heading}>
          <Text color="label" size="22pt" weight="heavy">
            {i18n.t(i18n.l.sports.competitions)}
          </Text>
        </View>
      ) : (
        <View style={[styles.separator, { backgroundColor: (isDarkMode ? white : black)(0.04) }]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  directory: { marginHorizontal: 20 },
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
  separator: { height: 2 },
});
