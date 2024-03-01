import MaskedView from '@react-native-masked-view/masked-view';
import lang from 'i18n-js';
import React, { useCallback, useEffect } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Reanimated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import RainbowText from '../components/icons/svg/RainbowText';
import { RainbowsBackground } from '../components/rainbows-background/RainbowsBackground';
import { Text } from '../components/text';
import { analytics } from '@/analytics';

import { useHideSplashScreen } from '@/hooks';
import { useNavigation } from '@/navigation';
import Routes from '@rainbow-me/routes';
import styled from '@/styled-thing';
import { fonts, position } from '@/styles';
import { ThemeContextProps, useTheme } from '@/theme';
import logger from 'logger';
import { IS_ANDROID, IS_TEST } from '@/env';
import { WelcomeScreenRainbowButton } from '@/screens/WelcomeScreen/WelcomeScreenRainbowButton';
import useCloudBackups from '@/hooks/useCloudBackups';
import { SheetTitle } from '@/components/sheet';

// @ts-expect-error Our implementation of SC complains
const Container = styled.View({
  ...position.coverAsObject,
  alignItems: 'center',
  backgroundColor: ({ theme: { colors } }: { theme: ThemeContextProps }) => colors.alpha(colors.white, 0.9),
  justifyContent: 'center',
});

export default function CheckIdentifierScreen() {
  const contentAnimation = useSharedValue(1);

  useAndroidBackHandler(() => {
    return true;
  });

  return (
    <Container testID="check-identifier-screen">
      <SheetTitle align="center" lineHeight="big" size={fonts.size.big} weight="heavy">
        We have detected an reinstall or phone migration. Please authenticate to continue.
      </SheetTitle>
    </Container>
  );
}
