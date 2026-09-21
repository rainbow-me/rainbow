import { StyleSheet, View } from 'react-native';

import { useForegroundColor } from '@/design-system/color/useForegroundColor';
import { GameCardSkeleton } from '@/features/sports/ui/GameCard';
import { SportsSectionHeadingSkeleton } from '@/features/sports/ui/SportsSection';
import useDimensions from '@/hooks/useDimensions';

type SkeletonLayout = 'directory' | 'live' | 'games' | 'search';

export function SportsSkeleton({ layout }: { layout: SkeletonLayout }) {
  const { width } = useDimensions();
  const backgroundColor = useForegroundColor('fillTertiary');
  if (layout === 'directory')
    return (
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="sports-loading">
        {[0, 1, 2, 3, 4, 5].map(index => (
          <View key={index} style={styles.skeletonDirectoryRow}>
            <View style={[styles.skeletonDirectoryIcon, { backgroundColor }]} />
            <View style={[styles.skeletonHeading, { backgroundColor }]} />
          </View>
        ))}
      </View>
    );
  const groups = layout === 'live' ? [1, 1, 1] : layout === 'search' ? [3] : [2, 1];
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="sports-loading">
      {groups.map((count, group) => (
        <View key={group}>
          <SportsSectionHeadingSkeleton />
          {Array.from({ length: count }, (_, card) => (
            <View key={card} style={styles.card}>
              <GameCardSkeleton width={width - 24} />
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
