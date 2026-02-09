import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Box, globalColors, useColorMode } from '@/design-system';
import { opacity } from '@/framework/ui/utils/opacity';
import { easing } from '@/components/animations/animationConfigs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { PolymarketTabSelector } from './PolymarketTabSelector';
import { PolymarketSearchButton } from '@/features/polymarket/screens/polymarket-navigator/PolymarketSearchButton';
import { usePolymarketNavigationStore } from '@/features/polymarket/screens/polymarket-navigator/PolymarketNavigator';
import { PolymarketRoute } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import Animated from 'react-native-reanimated';
import { DEFAULT_MOUNT_ANIMATIONS } from '@/components/utilities/MountWhenFocused';
import { NAVIGATOR_FOOTER_HEIGHT } from '@/features/polymarket/constants';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { IS_ANDROID } from '@/env';
import { PolymarketSearchFooter } from '@/features/polymarket/screens/polymarket-navigator/PolymarketSearchFooter';

const MAGIC_KEYBOARD_OFFSET_NUDGE = 6;
const DISTANCE_FROM_KEYBOARD = 20;

const DefaultFooter = memo(function DefaultFooter() {
  return (
    <View style={styles.defaultContent}>
      <PolymarketTabSelector />
      <PolymarketSearchButton />
    </View>
  );
});

export const PolymarketNavigatorFooter = function PolymarketNavigatorFooter() {
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const gradientColor = isDarkMode ? globalColors.grey100 : globalColors.white100;

  return (
    <>
      {/* Required to block touches from passing through on Android */}
      {IS_ANDROID && (
        <Box
          position="absolute"
          bottom="0px"
          left="0px"
          right="0px"
          width="full"
          height={NAVIGATOR_FOOTER_HEIGHT + safeAreaInsets.bottom}
        />
      )}
      <KeyboardStickyView offset={{ opened: safeAreaInsets.bottom + MAGIC_KEYBOARD_OFFSET_NUDGE - DISTANCE_FROM_KEYBOARD }}>
        <EasingGradient
          easing={easing.in.sin}
          startColor={opacity(gradientColor, 0)}
          endColor={opacity(gradientColor, 1)}
          startPosition={{ x: 0, y: 0 }}
          endPosition={{ x: 0, y: 0.8 }}
          style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 152, width: '100%' }}
        />
        <View
          style={[
            styles.container,
            {
              paddingBottom: safeAreaInsets.bottom,
              height: NAVIGATOR_FOOTER_HEIGHT + safeAreaInsets.bottom,
            },
          ]}
        >
          <MountWhenFocused route={[Routes.POLYMARKET_BROWSE_EVENTS_SCREEN, Routes.POLYMARKET_ACCOUNT_SCREEN]}>
            <DefaultFooter />
          </MountWhenFocused>

          <MountWhenFocused route={Routes.POLYMARKET_SEARCH_SCREEN}>
            <PolymarketSearchFooter />
          </MountWhenFocused>
        </View>
      </KeyboardStickyView>
    </>
  );
};

const MountWhenFocused = memo(function MountWhenFocused({
  children,
  route,
}: {
  children: React.ReactNode;
  route: PolymarketRoute | PolymarketRoute[];
}) {
  const isRouteActive = usePolymarketNavigationStore(state =>
    Array.isArray(route) ? route.some(r => state.isRouteActive(r)) : state.isRouteActive(route)
  );
  if (!isRouteActive) return null;
  return (
    <Animated.View entering={DEFAULT_MOUNT_ANIMATIONS.entering} exiting={DEFAULT_MOUNT_ANIMATIONS.exiting} style={styles.mountContainer}>
      {children}
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  easingGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',
    height: 152,
  },
  mountContainer: {
    flex: 1,
  },
  defaultContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
});
