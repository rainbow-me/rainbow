import lang from 'i18n-js';
import c from 'chroma-js';
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { IS_TESTING } from 'react-native-dotenv';
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
import { ButtonPressAnimation } from '@/components/animations';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { Page } from '@/components/layout';
import { Navbar } from '@/components/navbar/Navbar';
import {
  Box,
  Stack,
  Text,
  globalColors,
  useForegroundColor,
} from '@/design-system';
import { useAccountAccentColor } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
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
  const { navigate } = useNavigation();
  const { colors, isDarkMode } = useTheme();

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

  const handlePressGetStarted = React.useCallback(() => {
    navigate(Routes.CONSOLE_SHEET);
  }, [navigate]);

  React.useEffect(() => {
    if (IS_TESTING === 'true') return;

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
      <Box alignItems="center" flexGrow={1} justifyContent="center">
        <Box paddingBottom="104px" paddingHorizontal="20px" width="full">
          <Stack space="32px">
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
                <Text align="center" color="label" size="22pt" weight="heavy">
                  Claim your points
                </Text>
                <Box style={{ maxWidth: 260 }}>
                  <Text
                    align="center"
                    color="labelTertiary"
                    size="15pt"
                    weight="semibold"
                  >
                    Points are here. Find out how many you’ve been awarded.
                  </Text>
                </Box>
              </Stack>
            </Stack>
            <PointsActionButton
              color={accentColor}
              label="Get Started"
              onPress={handlePressGetStarted}
            />
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

const PointsActionButton = ({
  color,
  label,
  onPress,
  outline,
  small = false,
}: {
  color?: string;
  label: string;
  onPress?: () => void;
  outline?: boolean;
  small?: boolean;
}) => {
  const { isDarkMode } = useTheme();

  const fallbackColor = useForegroundColor('blue');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTeriary = useForegroundColor('separatorTertiary');

  const borderColor = isDarkMode ? separatorSecondary : separatorTeriary;

  const textColor = useMemo(() => {
    if (!color) return globalColors.white100;
    const contrastWithWhite = c.contrast(color, globalColors.white100);

    if (contrastWithWhite < 2.125) {
      return globalColors.grey100;
    } else {
      return globalColors.white100;
    }
  }, [color]);

  return (
    <ButtonPressAnimation
      onPress={onPress}
      scaleTo={0.88}
      style={styles.actionButtonWrapper}
      transformOrigin="top"
    >
      <Box
        paddingHorizontal={small ? '20px' : '24px'}
        style={[
          styles.actionButton,
          outline && styles.actionButtonOutline,
          {
            backgroundColor: outline ? 'transparent' : color || fallbackColor,
            borderColor: outline ? borderColor : undefined,
            height: small ? 44 : 48,
            shadowColor: outline ? 'transparent' : color || fallbackColor,
            shadowOpacity: isDarkMode ? 0.2 : 0.4,
          },
        ]}
      >
        <Text
          align="center"
          color={{ custom: outline ? color || fallbackColor : textColor }}
          size={small ? '17pt' : '20pt'}
          weight="heavy"
        >
          {label}
        </Text>
      </Box>
    </ButtonPressAnimation>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    alignContent: 'center',
    borderRadius: 24,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 13 },
    shadowRadius: 26,
  },
  actionButtonOutline: {
    borderWidth: 2,
  },
  actionButtonWrapper: {
    alignSelf: 'center',
  },
});
