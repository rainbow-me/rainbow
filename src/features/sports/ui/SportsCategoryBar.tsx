import { memo, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { globalColors } from '@/design-system/color/palettes';
import { type SportsHost } from '@/features/sports/core/browse';
import { sportsNavigationStores } from '@/features/sports/data/sportsNavigationStore';
import { sportsPageStores } from '@/features/sports/data/sportsPageStore';
import { useSportsStore } from '@/features/sports/data/sportsStore';
import { SPORTS_BACKGROUND_COLOR_DARK } from '@/features/sports/ui/colors';
import { FloatingTabBar, type FloatingTab } from '@/framework/ui/components/FloatingTabBar';
import * as i18n from '@/languages';

const EMPTY_CATEGORIES: readonly FloatingTab[] = [];

/**
 * Category tabs for Sports browsing.
 */
export const SportsCategoryBar = memo(function SportsCategoryBar({
  host,
  bottom,
  width,
  isDarkMode,
}: {
  host: SportsHost;
  bottom: number;
  width: number;
  isDarkMode: boolean;
}) {
  const categories = useSportsStore(s => s.catalog?.prominentCategories ?? EMPTY_CATEGORIES);
  const selectedCategory = sportsPageStores[host](s => s.selectedCategory);

  const tabs = useMemo(
    () => [{ key: 'live', label: i18n.t(i18n.l.sports.live) }, ...categories, { key: 'all', label: i18n.t(i18n.l.sports.more) }],
    [categories]
  );

  return (
    <FloatingTabBar
      style={[styles.bar, { bottom }]}
      tabs={tabs}
      selectedKey={selectedCategory}
      onSelect={sportsNavigationStores[host].getState().select}
      width={width - 40}
      isDarkMode={isDarkMode}
      shadowColor={isDarkMode ? SPORTS_BACKGROUND_COLOR_DARK : globalColors.grey100}
      onSearch={host === 'main' ? openSearch : undefined}
    />
  );
});

function openSearch(): void {
  sportsNavigationStores.main.getState().search('');
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
});
