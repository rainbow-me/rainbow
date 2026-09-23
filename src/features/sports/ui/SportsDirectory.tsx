import { memo, type ReactElement } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { Border } from '@/design-system/components/Border/Border';
import { Text } from '@/design-system/components/Text/Text';
import { TextIcon } from '@/design-system/components/TextIcon/TextIcon';
import { type SportsHost } from '@/features/sports/core/browse';
import { type SportsScope } from '@/features/sports/core/catalog';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { SportsBadge } from '@/features/sports/ui/SportsImage';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import { black, white } from '@/worklets/colors';

export const SportsDirectoryRow = memo(function SportsDirectoryRow({
  scope,
  count,
  host,
  competition,
  isDarkMode,
  style,
}: {
  scope: SportsScope;
  count: number;
  host: SportsHost;
  competition: boolean;
  isDarkMode: boolean;
  style?: ViewStyle;
}): ReactElement {
  return (
    <View style={[styles.directory, style]}>
      <ButtonPressAnimation onPress={() => sportsActions.openScope(host, scope.id)} scaleTo={0.98}>
        <View style={[styles.row, competition ? styles.competition : undefined]}>
          <SportsBadge isDarkMode={isDarkMode} scope={scope} size={competition ? 28 : 40} />

          <Text color="label" size={competition ? '17pt' : '20pt'} weight="heavy" numberOfLines={1} style={styles.name}>
            {scope.name}
          </Text>

          <View style={styles.trailing}>
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
            <TextIcon color={{ custom: (isDarkMode ? white : black)(0.3) }} size="icon 15px" weight="heavy" containerSize={16}>
              {'􀯻'}
            </TextIcon>
          </View>
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
