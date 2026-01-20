import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/BottomGradientGlow';
import { RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/FloatingCoins';
import { LoadingStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/LoadingStep';
import {
  ClaimSteps,
  RnbwRewardsTransitionContextProvider,
  useRnbwRewardsTransitionContext,
} from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { AirdropIntroductionStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/AirdropIntroductionStep';
import { ClaimAirdropStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/ClaimAirdropStep';
import { AirdropClaimFinishedStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/AirdropClaimFinished';
import { RnbwRewardsStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/RewardsStep';
import { Navbar } from '@/components/navbar/Navbar';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  return (
    <RnbwRewardsTransitionContextProvider initialStep={ClaimSteps.Rewards}>
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFill, { top: safeAreaInsets.top }]}>
          <BottomGradientGlow />
          <RnbwCoin />
          <FloatingCoins />
        </View>
        <RnbwRewardsContent />
      </View>
    </RnbwRewardsTransitionContextProvider>
  );
});

function RnbwRewardsContent() {
  const tabBarOffset = useTabBarOffset();
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={[{ flex: 1, paddingTop: safeAreaInsets.top, paddingBottom: tabBarOffset }]}>
      <Navbar leftComponent={<AccountImage />} floating />
      <RnbwRewardsSceneSteps />
    </View>
  );
}

function RnbwRewardsSceneSteps() {
  const { activeStepState, setActiveStep } = useRnbwRewardsTransitionContext();

  return (
    <View style={styles.stepsContainer}>
      {activeStepState === ClaimSteps.AirdropIntroduction && <AirdropIntroductionStep />}
      {activeStepState === ClaimSteps.CheckingAirdrop && (
        <LoadingStep
          labels={['Calculating Rewards...', 'Checking Historical Activity...', 'Checking Eligibility...']}
          onComplete={() => setActiveStep(ClaimSteps.ClaimAirdrop)}
        />
      )}
      {activeStepState === ClaimSteps.ClaimAirdrop && <ClaimAirdropStep />}
      {activeStepState === ClaimSteps.ClaimingAirdrop && (
        <LoadingStep
          labels={['Claiming Airdrop...', 'Gathering Coins...']}
          onComplete={() => setActiveStep(ClaimSteps.ClaimAirdropFinished)}
        />
      )}
      {activeStepState === ClaimSteps.ClaimAirdropFinished && <AirdropClaimFinishedStep />}
      {activeStepState === ClaimSteps.ClaimingRewards && (
        <LoadingStep labels={['Claiming Rewards...']} onComplete={() => setActiveStep(ClaimSteps.Rewards)} />
      )}
      {activeStepState === ClaimSteps.Rewards && <RnbwRewardsStep />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  stepsContainer: {
    flex: 1,
  },
});
