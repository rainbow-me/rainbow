import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '@/design-system';

export const PolymarketSearchScreen = memo(function PolymarketSearchScreen() {
  return (
    <View style={styles.container}>
      <Text size="20pt" weight="heavy" color="label">
        {'Search'}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
