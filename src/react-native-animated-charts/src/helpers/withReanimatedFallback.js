import React from 'react';
import { Text, TurboModuleRegistry } from 'react-native';

function ChartFallback() {
  return <Text> Charts are not available without Reanimated 2</Text>;
}

export default function withReanimatedFallback(
  ChartComponent,
  showText = false
) {
  return !TurboModuleRegistry.get('NativeReanimated') &&
    (!global.__reanimatedModuleProxy ||
      global.__reanimatedModuleProxy.__shimmed)
    ? showText
      ? ChartFallback
      : () => null
    : ChartComponent;
}
