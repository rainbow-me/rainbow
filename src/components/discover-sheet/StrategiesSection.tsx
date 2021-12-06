import React from 'react';
import { View } from 'react-native';
import { Column } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

export const StrategyShadow = (colors: any) => [
  [0, 2, 5, colors.red, 0.2],
  [0, 6, 10, colors.red, 0.14],
  [0, 1, 18, colors.red, 0.12],
];

export default function Strategies() {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  const shadows = StrategyShadow(colors);
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Column paddingHorizontal={12}>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text size="larger" weight="bold">
        🧠 Strategies
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Text color={colors.grey} size="medium" weight="bold">
        Smart yield strategies from yearn.finance
      </Text>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <View style={{ height: 100, marginTop: 12, width: 100 }}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ShadowStack
          backgroundColor={colors.red}
          borderRadius={12}
          shadows={shadows}
          style={{ height: 80, width: 80 }}
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="medium" weight="bold">
            osdnk coin
          </Text>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Text size="medium" weight="bold">
            2137%
          </Text>
        </ShadowStack>
      </View>
    </Column>
  );
}
