import { memo, useMemo, type ReactElement } from 'react';
import { StyleSheet } from 'react-native';

import { globalColors } from '@/design-system/color/palettes';
import { type SportsDestination, type SportsHost } from '@/features/sports/core/browse';
import { type SportsCatalog } from '@/features/sports/core/catalog';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { SPORTS_BACKGROUND_COLOR_DARK } from '@/features/sports/ui/colors';
import { FloatingTabBar } from '@/framework/ui/components/FloatingTabBar';
import * as i18n from '@/languages';

/**
 * Category tabs for Sports browsing.
 */
export const SportsCategoryBar = memo(function SportsCategoryBar({
  host,
  categories,
  selectedCategory,
  bottom,
  width,
  isDarkMode,
  catalog,
}: {
  host: SportsHost;
  categories: SportsDestination[];
  selectedCategory: SportsDestination;
  bottom: number;
  width: number;
  isDarkMode: boolean;
  catalog?: SportsCatalog;
}): ReactElement {
  const tabs = useMemo(
    () =>
      categories.map(destination => ({
        key: destination,
        label: getCategoryLabel(catalog, destination),
        onPress: () => sportsNavigationStores[host].getState().select(destination),
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
      onSearch={host === 'main' ? () => sportsNavigationStores[host].getState().search('') : undefined}
    />
  );
});

function getCategoryLabel(catalog: SportsCatalog | undefined, destination: SportsDestination): string {
  if (destination === 'live') return i18n.t(i18n.l.sports.live);
  if (destination === 'all') return i18n.t(i18n.l.sports.more);
  return catalog?.scopes[destination]?.name ?? '';
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
});
