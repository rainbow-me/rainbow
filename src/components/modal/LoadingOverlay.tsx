import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'react-native-blur-view';
import { useTheme } from '../../theme/ThemeContext';
import ActivityIndicator from '../ActivityIndicator';
import Spinner from '../Spinner';
import TouchableBackdrop from '../TouchableBackdrop';
import { Box, globalColors, Text } from '@/design-system';
import { IS_ANDROID, IS_IOS } from '@/env';
import { opacity } from '@/framework/ui/utils/opacity';
import neverRerender from '@/utils/neverRerender';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

type LoadingOverlayProps = {
  title?: string;
  paddingTop?: number;
  style?: StyleProp<ViewStyle>;
};

const LoadingOverlayComponent = ({ title, paddingTop = 0, style }: LoadingOverlayProps) => {
  const { colors, isDarkMode } = useTheme();
  const overlayBackgroundColor = IS_ANDROID ? colors.white : opacity(colors.blueGreyDark, 0.15);

  return (
    <Box alignItems="center" justifyContent="center" style={[styles.container, { paddingTop }, style]}>
      {IS_IOS ? <TouchableBackdrop disabled /> : null}
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
          {IS_ANDROID ? <Spinner color={colors.blueGreyDark} /> : <ActivityIndicator />}
          {title ? (
            <Text color={{ custom: colors.blueGreyDark }} size="20pt" style={styles.title} weight="semibold">
              {title}
            </Text>
          ) : null}
        </Box>
        {IS_IOS ? <BlurView blurIntensity={40} blurStyle={isDarkMode ? 'dark' : 'light'} style={styles.overlayBlur} /> : null}
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
