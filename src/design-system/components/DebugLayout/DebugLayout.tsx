import React, { ReactNode, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';

const styles = StyleSheet.create({
  debug: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    borderColor: 'red',
    borderWidth: 1,
  },
});

export function DebugLayout({ children, showDimensions = false }: { children: ReactNode; showDimensions?: boolean }) {
  const [layout, setLayout] = useState<{ width: number; height: number } | null>(null);

  return (
    <View>
      {showDimensions && (
        <View pointerEvents="none">
          <Text>Height: {layout?.height}</Text>
          <Text>Width: {layout?.width}</Text>
        </View>
      )}
      <View
        pointerEvents="none"
        style={styles.debug}
        onLayout={event => {
          const { width, height } = event.nativeEvent.layout;
          setLayout({ width, height });
        }}
      />
      {children}
    </View>
  );
}
