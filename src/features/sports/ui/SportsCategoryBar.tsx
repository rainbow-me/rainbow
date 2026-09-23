import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { globalColors } from '@/design-system/color/palettes';
import { getSportsDestinationKey, type SportsHost } from '@/features/sports/core/browse';
import { type SportsCatalog } from '@/features/sports/core/catalog';
import { type SportsNavigation } from '@/features/sports/data/sportsNavigation';
import { sportsActions } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK } from '@/features/sports/ui/colors';
import { FloatingTabBar } from '@/framework/ui/components/FloatingTabBar';
import * as i18n from '@/languages';

export const SportsCategoryBar = memo(function SportsCategoryBar({
  host,
  navigation,
  bottom,
  width,
  isDarkMode,
  catalog,
}: {
  host: SportsHost;
  navigation: SportsNavigation;
  bottom: number;
  width: number;
  isDarkMode: boolean;
  catalog?: SportsCatalog;
}): ReactElement {
  const { categories, selectedCategory } = navigation;

  const tabs = useMemo(
    () =>
      categories.map(destination => ({
        key: getSportsDestinationKey(destination),
        label:
          destination.type === 'scope'
            ? (catalog?.scopes[destination.scopeId]?.name ?? '')
            : i18n.t(destination.type === 'live' ? i18n.l.sports.live : i18n.l.sports.more),
        onPress: () => sportsActions.selectDestination(host, destination),
      })),
    [catalog, categories, host]
  );

  return (
    <FloatingTabBar
      style={[styles.bar, { bottom }]}
      tabs={tabs}
      selectedKey={selectedCategory}
      width={width - 40}
      isDarkMode={isDarkMode}
      shadowColor={isDarkMode ? SPORTS_BACKGROUND_COLOR_DARK : globalColors.grey100}
      onSearch={host === 'main' ? () => sportsActions.setSearch(host, '') : undefined}
    />
  );
});

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 20, right: 20 },
});
