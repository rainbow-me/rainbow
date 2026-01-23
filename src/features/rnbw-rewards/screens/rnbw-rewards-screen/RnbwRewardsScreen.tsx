import { memo, useMemo } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/BottomGradientGlow';
import { RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/FloatingCoins';
import {
  CheckingAirdropLoadingStep,
  ClaimingAirdropLoadingStep,
  ClaimingRewardsLoadingStep,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/LoadingSteps';
import {
  RnbwRewardsTransitionContextProvider,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { AirdropIntroductionStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/AirdropIntroductionStep';
import { ClaimAirdropStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/ClaimAirdropStep';
import { AirdropClaimFinishedStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/AirdropClaimFinished';
import { RnbwRewardsStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/RewardsStep';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { NoAirdropToClaimStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/NoAirdropToClaimStep';
import { useHasCompletedAirdrop } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/hooks/useHasCompletedAirdrop';
import { Box, ColorModeProvider, Text } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import rnbwCoinImage from '@/assets/rnbw.png';
import { useRnbwRewardsFlowStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsFlowStore';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const [hasCompletedAirdropFlow] = useHasCompletedAirdrop();

  const initialStep = useMemo(() => {
    return hasCompletedAirdropFlow ? ClaimSteps.Rewards : ClaimSteps.AirdropIntroduction;
  }, [hasCompletedAirdropFlow]);

  return (
    <ColorModeProvider value="dark">
      <RnbwRewardsTransitionContextProvider initialStep={initialStep}>
        <View style={styles.container}>
          <RnbwRewardsContent />
        </View>
      </RnbwRewardsTransitionContextProvider>
    </ColorModeProvider>
  );
});

function RnbwRewardsContent() {
  const { scrollOffset } = useRnbwRewardsTransitionContext();
  const tabBarOffset = useTabBarOffset();
  const safeAreaInsets = useSafeAreaInsets();

  const rnbwCoinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollOffset.value }],
    };
  }, [scrollOffset]);

  return (
    <View style={styles.flex}>
      <RnbwRewardsNavbar />
      <View style={{ flex: 1, paddingBottom: tabBarOffset, paddingTop: safeAreaInsets.top + navbarHeight }}>
        <BottomGradientGlow />
        <Animated.View style={rnbwCoinAnimatedStyle}>
          <RnbwCoin />
        </Animated.View>
        <FloatingCoins />
        <RnbwRewardsSceneSteps />
      </View>
    </View>
  );
}

const RnbwRewardsNavbar = memo(function RnbwRewardsNavbar() {
  const activeStepState = useRnbwRewardsFlowStore(state => state.activeStep);

  const navbarTitle = useMemo(() => {
    return activeStepState === ClaimSteps.Rewards ? 'Rewards' : '';
  }, [activeStepState]);

  const navbarRightComponent = useMemo(() => {
    return activeStepState === ClaimSteps.Rewards ? <NavbarRnbwBalance /> : null;
  }, [activeStepState]);

  return <Navbar title={navbarTitle} leftComponent={<AccountImage />} rightComponent={navbarRightComponent} floating />;
});

function NavbarRnbwBalance() {
  // TODO: This will require knowing the RNBW token contract address
  const rnbwBalance = 123.5;
  return (
    <Box
      paddingVertical={'8px'}
      paddingLeft={'8px'}
      paddingRight={'10px'}
      borderWidth={1}
      borderColor="separatorTertiary"
      borderRadius={32}
      backgroundColor={opacityWorklet('#F5F8FF', 0.06)}
      flexDirection="row"
      alignItems="center"
      gap={4}
    >
      <Image source={rnbwCoinImage} style={{ width: 22, height: 22 }} />
      <Text size="15pt" weight="bold" color="label">
        {rnbwBalance}
      </Text>
    </Box>
  );
}

function RnbwRewardsSceneSteps() {
  const activeStepState = useRnbwRewardsFlowStore(state => state.activeStep);

  return (
    <View style={styles.flex}>
      {activeStepState === ClaimSteps.AirdropIntroduction && <AirdropIntroductionStep />}
      {activeStepState === ClaimSteps.CheckingAirdrop && <CheckingAirdropLoadingStep />}
      {activeStepState === ClaimSteps.ClaimAirdrop && <ClaimAirdropStep />}
      {activeStepState === ClaimSteps.ClaimingAirdrop && <ClaimingAirdropLoadingStep />}
      {activeStepState === ClaimSteps.ClaimAirdropFinished && <AirdropClaimFinishedStep />}
      {activeStepState === ClaimSteps.ClaimingRewards && <ClaimingRewardsLoadingStep />}
      {activeStepState === ClaimSteps.NoAirdropToClaim && <NoAirdropToClaimStep />}
      {activeStepState === ClaimSteps.Rewards && <RnbwRewardsStep />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  flex: {
    flex: 1,
  },
});
