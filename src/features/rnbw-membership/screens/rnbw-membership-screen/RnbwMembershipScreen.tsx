import { memo, useState, useCallback } from 'react';
import { RefreshControl, StyleSheet } from 'react-native';
import { Box, useColorMode } from '@/design-system';
import { AccountImage } from '@/components/AccountImage';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { RnbwRewardsClaimCard } from './components/RnbwRewardsClaimCard';
import { RnbwAirdropClaimCard } from './components/RnbwAirdropClaimCard';
import { RnbwStakingCard } from './components/RnbwStakingCard';
import { MembershipTierCard } from './components/MembershipTierCard';
import { useRewardsBalanceStore } from '@/features/rnbw-rewards/stores/rewardsBalanceStore';
import { useStakingPositionStore } from '@/features/rnbw-staking/stores/rnbwStakingPositionStore';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { RnbwStakingEarningsCard } from './components/RnbwStakingEarningsCard';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { TierBadge } from '@/features/rnbw-membership/components/TierBadge';
import { useMembershipTierInfo } from '@/features/rnbw-membership/stores/derived/useMembershipTierInfo';
import { IS_ANDROID } from '@/env';
import { ScrollHeaderFade } from '@/components/scroll-header-fade/ScrollHeaderFade';
import { useScrollFadeHandler } from '@/components/scroll-header-fade/useScrollFadeHandler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getValueForColorMode } from '@/design-system/color/palettes';
import { MEMBERSHIP_SCREEN_BACKGROUND_COLOR } from '@/features/rnbw-membership/constants';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

export const RnbwMembershipScreen = memo(function RnbwMembershipScreen() {
  const { colorMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();
  const backgroundColor = getValueForColorMode(MEMBERSHIP_SCREEN_BACKGROUND_COLOR, colorMode);
  const scrollOffset = useSharedValue(0);
  const onScroll = useScrollFadeHandler(scrollOffset);
  const bottomInset = TAB_BAR_HEIGHT + 16;

  return (
    <Box backgroundColor={backgroundColor} style={styles.flex} testID="rnbw-membership-screen">
      <Navbar hasStatusBarInset titleComponent={<CurrentTierBadge />} leftComponent={<AccountImage />} />
      <ScrollHeaderFade color={backgroundColor} height={32} scrollOffset={scrollOffset} topInset={safeAreaInsets.top + navbarHeight} />
      <Animated.ScrollView
        refreshControl={<RefreshControlWrapper />}
        contentContainerStyle={[styles.scrollViewContentContainer, { paddingBottom: IS_ANDROID ? bottomInset : 0 }]}
        style={styles.flex}
        onScroll={onScroll}
        contentInset={{
          bottom: bottomInset,
        }}
      >
        <Box gap={16}>
          <RnbwStakingCard />
          <RnbwStakingEarningsCard />
          <MembershipTierCard />
          <RnbwRewardsClaimCard />
          <RnbwAirdropClaimCard />
        </Box>
      </Animated.ScrollView>
    </Box>
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

function CurrentTierBadge() {
  const { currentTier } = useMembershipTierInfo();

  return (
    <ButtonPressAnimation onPress={navigateToMembershipTiersSheet}>
      <TierBadge tier={currentTier} height={32} fontSize="17pt" />
    </ButtonPressAnimation>
  );
}

function navigateToMembershipTiersSheet() {
  Navigation.handleAction(Routes.RNBW_MEMBERSHIP_TIERS_SHEET);
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollViewContentContainer: {
    paddingHorizontal: 20,
  },
});
