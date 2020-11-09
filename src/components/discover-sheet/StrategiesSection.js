import React from 'react';
import { View } from 'react-native';
import { Column } from '../layout';
import { Text } from '../text';
import { colors } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

export const StrategyShadow = [
  [0, 2, 5, colors.red, 0.2],
  [0, 6, 10, colors.red, 0.14],
  [0, 1, 18, colors.red, 0.12],
];

export default function Strategies() {
  return (
    <Column paddingHorizontal={12}>
      <Text size="larger" weight="bold">
        🧠 Strategies
      </Text>
      <Text color={colors.grey} size="medium" weight="bold">
        Smart yield strategies from yearn.finance
      </Text>
      <View style={{ height: 100, marginTop: 12, width: 100 }}>
        <ShadowStack
          backgroundColor={colors.red}
          borderRadius={12}
          shadows={StrategyShadow}
          style={{ height: 80, width: 80 }}
        >
          <Text size="medium" weight="bold">
            osdnk coin
          </Text>
          <Text size="medium" weight="bold">
            2137%
          </Text>
        </ShadowStack>
      </View>
    </Column>
  );
}
