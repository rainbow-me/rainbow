import React from 'react';
// @ts-expect-error ts-migrate(2305) FIXME: Module '"react-native"' has no exported member 'Tu... Remove this comment to see the full error message
import { Text, TurboModuleRegistry } from 'react-native';

function ChartFallback() {
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  return <Text>Charts are not available without Reanimated 2</Text>;
}

export default function withReanimatedFallback(
  ChartComponent: any,
  showText = false
) {
  return !TurboModuleRegistry.get('NativeReanimated') &&
    // @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
    (!global.__reanimatedModuleProxy ||
      // @ts-expect-error ts-migrate(7017) FIXME: Element implicitly has an 'any' type because type ... Remove this comment to see the full error message
      global.__reanimatedModuleProxy.__shimmed)
    ? showText
      ? ChartFallback
      : () => null
    : ChartComponent;
}
