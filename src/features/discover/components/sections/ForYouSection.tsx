import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { PerpMarketsCarousel } from '@/features/discover/components/carousels/PerpMarketsCarousel';
import { PredictionsCarousel } from '@/features/discover/components/carousels/PredictionsCarousel';

export const ForYouSection = memo(function ForYouSection() {
  return (
    <View style={styles.container}>
      <PerpMarketsCarousel />
      <PredictionsCarousel />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    gap: 32,
  },
});
