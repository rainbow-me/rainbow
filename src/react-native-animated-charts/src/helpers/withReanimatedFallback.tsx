// @ts-nocheck
import React from 'react';
import { Text, TurboModuleRegistry } from 'react-native';

function ChartFallback() {
  return <Text>Charts are not available without Reanimated 2</Text>;
}

export default function withReanimatedFallback<T extends React.Compo>(
  ChartComponent: T,
  showText = false
): T {
  return !TurboModuleRegistry.get('NativeReanimated') &&
    (!global.__reanimatedModuleProxy ||
      global.__reanimatedModuleProxy.__shimmed)
    ? showText
      ? ChartFallback
      : () => null
    : ChartComponent;
}
