import React from 'react';
import { Text } from '../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

export const PulseIndexShadow = [
  [0, 2, 5, colors_NOT_REACTIVE.orange, 0.2],
  [0, 6, 10, colors_NOT_REACTIVE.orange, 0.14],
  [0, 1, 18, colors_NOT_REACTIVE.orange, 0.12],
];

export default function PulseIndex() {
  return (
    <ShadowStack
      backgroundColor={colors_NOT_REACTIVE.orangeLight}
      borderRadius={18}
      shadows={PulseIndexShadow}
      style={{ height: 80, margin: 12, width: '100%' }}
    >
      <Text size="medium" style={{ margin: 12 }} weight="bold">
        Here will be pulse something
      </Text>
    </ShadowStack>
  );
}
