/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ColorModeProvider, useColorMode } from '../../color/ColorMode';
import { Docs } from '../../playground/Docs';
import { Columns } from '../Columns/Columns';
import { Inset } from '../Inset/Inset';
import { Stack } from '../Stack/Stack';
import { Text } from '../Text/Text';
import { Box } from './Box';

function BackgroundDemo() {
  const { backgroundColors } = useColorMode();

  return (
    <>
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[])
        .sort()
        .map(color => (
          <Box background={color} key={color}>
            <Inset space="19px">
              <Stack space="10px">
                <Text color="primary" weight="bold">
                  {color}
                </Text>
                <Text color="secondary50" weight="bold">
                  {color}
                </Text>
              </Stack>
            </Inset>
          </Box>
        ))}
    </>
  );
}

const docs: Docs = {
  name: 'Box',
  category: 'Layout',
  examples: [
    {
      name: 'Backgrounds',
      Example: () => (
        <Columns space="19px">
          <Stack space="10px">
            <Text weight="bold">Light mode</Text>
            <ColorModeProvider value="light">
              <BackgroundDemo />
            </ColorModeProvider>
          </Stack>
          <Stack space="10px">
            <Text weight="bold">Dark mode</Text>
            <ColorModeProvider value="dark">
              <BackgroundDemo />
            </ColorModeProvider>
          </Stack>
        </Columns>
      ),
    },
    {
      name: 'With animation',
      Example: () => {
        const offsetRatio = useSharedValue(0);
        const containerWidth = useSharedValue(0);
        const boxSize = 100;

        const sizeStyles = useMemo(
          () => ({
            width: boxSize,
            height: boxSize,
          }),
          [boxSize]
        );

        const animatedStyles = useAnimatedStyle(() => ({
          transform: [
            {
              translateX: withSpring(
                offsetRatio.value * (containerWidth.value - boxSize)
              ),
            },
          ],
        }));

        return (
          <View
            onLayout={event =>
              (containerWidth.value = event.nativeEvent.layout.width)
            }
          >
            <Stack space="19px">
              <Box
                as={Animated.View}
                background="accent"
                style={[sizeStyles, animatedStyles]}
              />
              <TouchableOpacity
                onPress={() => (offsetRatio.value = Math.random())}
              >
                <Text align="center" color="accent" weight="bold">
                  Move
                </Text>
              </TouchableOpacity>
            </Stack>
          </View>
        );
      },
    },
  ],
};

export default docs;
