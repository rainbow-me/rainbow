import { StyleSheet, View } from 'react-native';

import ShimmerAnimation from '@/components/animations/ShimmerAnimation';
import { useBackgroundColor, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';

type CarouselCardSkeletonProps = {
  borderRadius: number;
  height: number;
  width: number;
};

export function CarouselCardSkeleton({ borderRadius, height, width }: CarouselCardSkeletonProps) {
  const { isDarkMode } = useColorMode();
  const fillQuaternary = useBackgroundColor('fillQuaternary');
  const fillSecondary = useBackgroundColor('fillSecondary');
  const shimmerColor = opacity(fillSecondary, 0.1);
  const skeletonColor = isDarkMode ? fillQuaternary : fillSecondary;

  return (
    <View style={[styles.skeleton, { backgroundColor: skeletonColor, borderRadius, height, width }]}>
      <ShimmerAnimation color={shimmerColor} gradientColor={shimmerColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
