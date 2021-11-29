import React from 'react';
import { Text, TurboModuleRegistry } from 'react-native';

function ChartFallback() {
  return <Text>Charts</Text>;
}

export default function withReanimatedFallback<T extends React.ComponentType>(
  ChartComponent: T,
  showText = false
): T | () => null {
  return !TurboModuleRegistry.get('NativeReanimated') &&
    (!global.__reanimatedModuleProxy ||
      global.__reanimatedModuleProxy.__shimmed)
    ? showText
      ? ChartFallback
      : () => null
    : ChartComponent;
}
