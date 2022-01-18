import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

const styles = StyleSheet.create({
  debug: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'red',
    borderWidth: 1,
  },
});

export function DebugLayout({ children }: { children: ReactNode }) {
  return (
    <View>
      <View pointerEvents="none" style={styles.debug} />
      {children}
    </View>
  );
}
