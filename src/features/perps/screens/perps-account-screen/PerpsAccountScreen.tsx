import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, Separator, Stack, useColorMode } from '@/design-system';
import { FOOTER_HEIGHT, PERPS_BACKGROUND_DARK, PERPS_BACKGROUND_LIGHT } from '@/features/perps/constants';
import { PerpsAccountBalanceCard } from '@/features/perps/screens/perps-account-screen/AccountBalanceCard';
import { MarketsSection } from '@/features/perps/screens/perps-account-screen/MarketsSection';
import { OpenPositionsSection } from '@/features/perps/screens/perps-account-screen/OpenPositionsSection';
import { usePerpsNavigationStore } from '@/features/perps/screens/PerpsNavigator';
import Routes from '@/navigation/routesNames';

export const PerpsAccountScreen = function PerpsAccountScreen() {
  const { isDarkMode } = useColorMode();

  const params = usePerpsNavigationStore(state => state.getParams(Routes.PERPS_ACCOUNT_SCREEN));
  const scrollOffset = useSharedValue(0);
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const onScroll = useScrollFadeHandler(scrollOffset);

  const backgroundColor = isDarkMode ? PERPS_BACKGROUND_DARK : PERPS_BACKGROUND_LIGHT;

  useEffect(() => {
    if (params?.scrollToTop) {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      usePerpsNavigationStore.getState().setParams(Routes.PERPS_ACCOUNT_SCREEN, { ...params, scrollToTop: undefined });
    }
  }, [params?.scrollToTop, params]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        contentContainerStyle={styles.contentContainer}
        onScroll={onScroll}
        ref={scrollViewRef}
        scrollIndicatorInsets={styles.scrollIndicatorInsets}
        style={{ backgroundColor }}
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

      <ScrollHeaderFade color={backgroundColor} scrollOffset={scrollOffset} />
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
  scrollIndicatorInsets: {
    bottom: FOOTER_HEIGHT,
  },
});
