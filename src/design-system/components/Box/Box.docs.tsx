/* eslint-disable sort-keys-fix/sort-keys-fix */
import React, { useMemo } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../color/ColorMode' was resolved to '/U... Remove this comment to see the full error message
import { ColorModeProvider, useColorMode } from '../../color/ColorMode';
import { Docs } from '../../playground/Docs';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Columns/Columns' was resolved to '/User... Remove this comment to see the full error message
import { Columns } from '../Columns/Columns';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Inset/Inset' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Inset } from '../Inset/Inset';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Stack/Stack' was resolved to '/Users/ni... Remove this comment to see the full error message
import { Stack } from '../Stack/Stack';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../Text/Text' was resolved to '/Users/nick... Remove this comment to see the full error message
import { Text } from '../Text/Text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './Box' was resolved to '/Users/nickbytes/r... Remove this comment to see the full error message
import { Box } from './Box';

function BackgroundDemo() {
  const { backgroundColors } = useColorMode();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      {(Object.keys(backgroundColors) as (keyof typeof backgroundColors)[])
        .sort()
        .map(color => (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <Box background={color} key={color}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Inset space="19px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Stack space="10px">
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text color="primary" weight="bold">
                  {color}
                </Text>
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
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
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Columns space="19px">
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text weight="bold">Light mode</Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColorModeProvider value="light">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <BackgroundDemo />
            </ColorModeProvider>
          </Stack>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Stack space="10px">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Text weight="bold">Dark mode</Text>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ColorModeProvider value="dark">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <View
            onLayout={event =>
              (containerWidth.value = event.nativeEvent.layout.width)
            }
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <Stack space="19px">
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <Box
                as={Animated.View}
                background="accent"
                borderRadius={20}
                style={[sizeStyles, animatedStyles]}
              />
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
              the '--jsx' flag is provided... Remove this comment to see the
              full error message
              <TouchableOpacity
                onPress={() => (offsetRatio.value = Math.random())}
              >
                // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX
                unless the '--jsx' flag is provided... Remove this comment to
                see the full error message
                <Text align="center" color="action" weight="bold">
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
