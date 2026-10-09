import { StyleSheet, View } from 'react-native';

import { foregroundColors } from '@/design-system/color/palettes';
import { type SportsPage } from '@/features/sports/data/sportsPageStore';
import { GameCardSkeleton } from '@/features/sports/ui/GameCard';
import { SportsSectionHeadingSkeleton } from '@/features/sports/ui/SportsSection';

/**
 * Loading placeholders for Sports browse pages.
 */
export function SportsSkeleton({ page, width, isDarkMode }: { page: SportsPage; width: number; isDarkMode: boolean }) {
  const backgroundColor = foregroundColors.fillTertiary[isDarkMode ? 'dark' : 'light'];

  if (page === 'sports') {
    return (
      <View pointerEvents="none" testID="sports-loading">
        {[0, 1, 2, 3, 4, 5].map(index => (
          <View key={index} style={styles.skeletonDirectoryRow}>
            <View style={[styles.skeletonDirectoryIcon, { backgroundColor }]} />
            <View style={[styles.skeletonHeading, { backgroundColor }]} />
          </View>
        ))}
      </View>
    );
  }

  const groups = page === 'live' ? [1, 1, 1] : page === 'search' ? [3] : [2, 1];

  return (
    <View pointerEvents="none" testID="sports-loading">
      {groups.map((count, group) => (
        <View key={group}>
          <SportsSectionHeadingSkeleton backgroundColor={backgroundColor} />
          {Array.from({ length: count }, (_, card) => (
            <View key={card} style={styles.card}>
              <GameCardSkeleton isDarkMode={isDarkMode} width={width - 24} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 12, marginBottom: 8 },
  skeletonHeading: {
    width: 92,
    height: 16,
    borderRadius: 8,
  },
  skeletonDirectoryRow: {
    height: 66,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  skeletonDirectoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
});
