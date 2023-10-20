import lang from 'i18n-js';
import React from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  Easing,
  withDelay,
  interpolate,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { FloatingEmojisTapper } from '@/components/floating-emojis';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import { Box, Stack, Text } from '@/design-system';
import { useAccountAccentColor, useDimensions } from '@/hooks';
import { useTheme } from '@/theme';

const fallConfig = {
  duration: 2000,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const jumpConfig = {
  duration: 500,
  easing: Easing.bezier(0.2, 0, 0, 1),
};
const flyUpConfig = {
  duration: 2500,
  easing: Easing.bezier(0.05, 0.7, 0.1, 1.0),
};

export default function PointsScreen() {
  const { accentColor } = useAccountAccentColor();
  const { colors, isDarkMode } = useTheme();
  const { height: deviceHeight, width: deviceWidth } = useDimensions();

  const iconState = useSharedValue(1);
  const progress = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0.75, 0.7, 0.65, 0.55, 0.75, 0.7, 0.65, 0.55, 0.75]
    );
    const rotate = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-12, -4, -12, -12, -372, -380, -372, -372, -12]
    );
    const translateX = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [0, 4, 0, 0, 0, -4, 0, 0, 0]
    );
    const translateY = interpolate(
      progress.value,
      [0, 1, 2, 3, 4, 5, 6, 7, 8],
      [-20, -5, 10, 14, -20, -5, 10, 14, -20]
    );

    return {
      transform: [
        { translateX },
        { translateY },
        { rotate: `${rotate}deg` },
        { scale },
      ],
    };
  });

  React.useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, fallConfig),
          withTiming(2, fallConfig),
          withTiming(3, jumpConfig),
          withTiming(4, flyUpConfig),
          withTiming(5, fallConfig),
          withTiming(6, fallConfig),
          withTiming(7, jumpConfig),
          withTiming(8, flyUpConfig)
        ),
        -1,
        false
      )
    );
  }, [progress]);

  return (
    <Box as={Page} flex={1} testID="points-screen" width="full">
      <Navbar hasStatusBarInset title={lang.t('account.tab_points')} />
      <Box
        alignItems="center"
        as={Page}
        flex={1}
        height="full"
        justifyContent="center"
      >
        <Box paddingBottom="104px" width="full">
          <Stack alignHorizontal="center" space="28px">
            <Box
              alignItems="center"
              as={Animated.View}
              justifyContent="center"
              style={[{ height: 28, width: 28 }, animatedStyle]}
            >
              <TabBarIcon
                accentColor={accentColor}
                hideShadow
                icon="tabPoints"
                index={1}
                reanimatedPosition={iconState}
                size={56}
                tintBackdrop={colors.white}
                tintOpacity={isDarkMode ? 0.25 : 0.1}
              />
            </Box>
            <Stack alignHorizontal="center" space="20px">
              <Text
                align="center"
                color="labelTertiary"
                size="26pt"
                weight="semibold"
              >
                {lang.t('points.coming_soon_title')}
              </Text>
              <Text
                align="center"
                color="labelQuaternary"
                size="15pt"
                weight="medium"
              >
                {lang.t('points.coming_soon_description')}
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Box>
      <Box
        as={FloatingEmojisTapper}
        distance={500}
        duration={4000}
        emojis={[
          'rainbow',
          'rainbow',
          'rainbow',
          'slot_machine',
          'slot_machine',
        ]}
        gravityEnabled
        position="absolute"
        range={[0, 0]}
        size={80}
        wiggleFactor={0}
        yOffset={-66}
      >
        <Box
          position="absolute"
          style={{
            height: deviceHeight,
            width: deviceWidth,
          }}
        />
      </Box>
    </Box>
  );
}
