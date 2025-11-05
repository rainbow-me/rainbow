import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Box, Separator, Stack, useColorMode } from '@/design-system';
import { HeaderFade } from '@/features/perps/components/HeaderFade';
import { FOOTER_HEIGHT, PERPS_BACKGROUND_LIGHT, PERPS_BACKGROUND_DARK } from '@/features/perps/constants';
import { PerpsAccountBalanceCard } from '@/features/perps/screens/perps-account-screen/AccountBalanceCard';
import { MarketsSection } from '@/features/perps/screens/perps-account-screen/MarketsSection';
import { OpenPositionsSection } from '@/features/perps/screens/perps-account-screen/OpenPositionsSection';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { clamp } from '@/__swaps__/utils/swaps';
import { usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import Routes from '@/navigation/routesNames';

const HEADER_FADE_DISTANCE = 8;

export const PerpsAccountScreen = function PerpsAccountScreen() {
  const { isDarkMode } = useColorMode();
  const scrollPosition = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const params = usePerpsNavigationStore(state => state.getParams(Routes.PERPS_ACCOUNT_SCREEN));

  const headerFadeStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollPosition.value, [0, HEADER_FADE_DISTANCE], [0, 1], 'clamp'),
  }));

  useEffect(() => {
    if (params?.scrollToTop) {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      usePerpsNavigationStore.getState().setParams(Routes.PERPS_ACCOUNT_SCREEN, { ...params, scrollToTop: undefined });
    }
  }, [params?.scrollToTop, scrollPosition, params]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.contentContainer}
        onScroll={event => {
          const clampedPosition = clamp(event.nativeEvent.contentOffset.y, 0, HEADER_FADE_DISTANCE);
          if (scrollPosition.value === clampedPosition) return;
          scrollPosition.value = clampedPosition;
        }}
        scrollIndicatorInsets={styles.scrollIndicatorInsets}
        style={{ backgroundColor: isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT }}
      >
        <Box gap={20} width="full">
          <PerpsAccountBalanceCard />

          <Stack space="24px">
            <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
            <OpenPositionsSection />
            <Separator color="separatorTertiary" direction="horizontal" thickness={THICK_BORDER_WIDTH} />
            <MarketsSection />
          </Stack>
        </Box>
      </Animated.ScrollView>

      <Animated.View style={[styles.fadeContainer, headerFadeStyle]}>
        <HeaderFade />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: FOOTER_HEIGHT + 12,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  fadeContainer: {
    left: 0,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
  },
  scrollIndicatorInsets: {
    bottom: FOOTER_HEIGHT,
  },
});
