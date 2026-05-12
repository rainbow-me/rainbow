import React from 'react';
import { Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { BlurView } from 'react-native-blur-view';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Box, globalColors, Text } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import neverRerender from '@/utils/neverRerender';

import { useTheme } from '../../theme/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';

type LoadingOverlayProps = {
  title?: string;
  paddingTop?: number;
  style?: StyleProp<ViewStyle>;
};

const LoadingOverlayComponent = ({ title, paddingTop = 0, style }: LoadingOverlayProps) => {
  const { colors, isDarkMode } = useTheme();
  const overlayBackgroundColor = Platform.OS === 'android' ? colors.white : opacity(colors.blueGreyDark, 0.15);

  return (
    <Box alignItems="center" justifyContent="center" style={[styles.container, { paddingTop }, style]}>
      {Platform.OS === 'ios' ? <TouchableBackdrop disabled /> : null}
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={[StyleSheet.absoluteFillObject, { backgroundColor: opacity(globalColors.grey100, 0.7) }]}
      />
      <Box
        alignItems="center"
        borderRadius={20}
        justifyContent="center"
        overflow="hidden"
        paddingTop={{ custom: 19 }}
        paddingRight={{ custom: 19 }}
        paddingBottom={{ custom: 22 }}
        paddingLeft={{ custom: 19 }}
        style={{ backgroundColor: overlayBackgroundColor }}
      >
        <Box alignItems="center" flexDirection="row" justifyContent="center" zIndex={2}>
          {Platform.OS === 'android' ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator />}
          {title ? (
            <Text color={{ custom: colors.blueGreyDark }} size="20pt" style={styles.title} weight="semibold">
              {title}
            </Text>
          ) : null}
        </Box>
        {Platform.OS === 'ios' ? (
          <BlurView blurIntensity={40} blurStyle={isDarkMode ? 'dark' : 'light'} style={styles.overlayBlur} />
        ) : null}
      </Box>
    </Box>
  );
};

export const LoadingOverlay = neverRerender(LoadingOverlayComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  overlayBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  title: {
    marginLeft: 8,
  },
});
