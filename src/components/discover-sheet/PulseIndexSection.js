import React from 'react';
import { lightModeThemeColors } from '../../styles/colors';
import { Text } from '../text';
import ShadowStack from 'react-native-shadow-stack';

export const PulseIndexShadow = [
  [0, 2, 5, lightModeThemeColors.orange, 0.2],
  [0, 6, 10, lightModeThemeColors.orange, 0.14],
  [0, 1, 18, lightModeThemeColors.orange, 0.12],
];

export default function PulseIndex() {
  return (
    <ShadowStack
      backgroundColor={lightModeThemeColors.orangeLight}
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
