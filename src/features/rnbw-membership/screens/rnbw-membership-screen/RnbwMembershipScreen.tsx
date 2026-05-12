import { memo, useCallback, useState } from 'react';
import { Platform, RefreshControl, View } from 'react-native';

import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountImage } from '@/components/AccountImage';
import { Navbar } from '@/components/navbar/Navbar';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import { Box, useColorMode } from '@/design-system';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { MEMBERSHIP_SCREEN_BACKGROUND_COLOR } from '@/features/rnbw-membership/constants';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import useDimensions from '@/hooks/useDimensions';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';

import { MembershipTierCard } from './components/MembershipTierCard';
import { RnbwAirdropClaimCard } from './components/RnbwAirdropClaimCard';
import { RnbwRewardsClaimCard } from './components/RnbwRewardsClaimCard';
import { RnbwStakingCard } from './components/RnbwStakingCard';
import { RnbwStakingEarningsCard } from './components/RnbwStakingEarningsCard';

const MEMBERSHIP_SCREEN_HORIZONTAL_PADDING = 20;

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const { colorMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const { width: screenWidth } = useDimensions();
  const backgroundColor = getValueForColorMode(MEMBERSHIP_SCREEN_BACKGROUND_COLOR, colorMode);
  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);
  const bottomInset = TAB_BAR_HEIGHT + 16;
  const stakingCardWidth = screenWidth - MEMBERSHIP_SCREEN_HORIZONTAL_PADDING * 2;

  const scrollViewAnimatedStyle = useAnimatedStyle(() => ({
    flex: 1,
    overflow: scrollOffset.value > 0 ? 'hidden' : 'visible',
  }));

  return (
    <View style={{ flex: 1, backgroundColor, paddingTop: safeAreaInsets.top }} testID="rnbw-membership-screen">
      <ScrollHeaderFade color={backgroundColor} height={32} scrollOffset={scrollOffset} topInset={safeAreaInsets.top} />
      <Animated.ScrollView
        refreshControl={<RefreshControlWrapper />}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'android' ? bottomInset : 0,
        }}
        style={scrollViewAnimatedStyle}
        onScroll={onScroll}
        contentInset={{
          bottom: bottomInset,
        }}
      >
        <Navbar leftComponent={<AccountImage />} />
        <Box gap={16} paddingHorizontal={{ custom: MEMBERSHIP_SCREEN_HORIZONTAL_PADDING }}>
          <RnbwStakingCard width={stakingCardWidth} />
          <RnbwStakingEarningsCard />
          <MembershipTierCard />
          <RnbwRewardsClaimCard />
          <RnbwAirdropClaimCard />
        </Box>
      </Animated.ScrollView>
    </View>
  );
});

function RefreshControlWrapper(props: Omit<React.ComponentProps<typeof RefreshControl>, 'refreshing' | 'onRefresh'>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.allSettled([
      Promise.allSettled([
        useRewardsBalanceStore.getState().fetch(undefined, { force: true }),
        useAirdropBalanceStore.getState().fetch(undefined, { force: true }),
        useStakingPositionStore.getState().fetch(undefined, { force: true }),
      ]),
      delay(time.seconds(1)),
    ]);
    setIsRefreshing(false);
  }, []);

  return (
    <RefreshControl
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      refreshing={isRefreshing}
      onRefresh={handleRefresh}
    />
  );
}
