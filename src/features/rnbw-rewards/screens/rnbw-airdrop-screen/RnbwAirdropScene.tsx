import { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { IntroductionStep } from './steps/IntroductionStep';
import { ClaimSteps, useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import { LoadingStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/CheckingAirdropStep';
import { ClaimAirdropStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/ClaimAirdropStep';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { NothingToClaimStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/NothingToClaimStep';
import { AirdropClaimFinishedStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/AirdropClaimFinished';

export const RnbwAirdropScene = memo(function RnbwAirdropScene() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();

  useEffect(() => {
    setActiveStep(ClaimSteps.Introduction);
  }, [setActiveStep]);

  return (
    <View style={styles.container}>
      <RnbwAirdropSceneSteps />
    </View>
  );
});

function RnbwAirdropSceneSteps() {
  const tabBarOffset = useTabBarOffset();
  const { activeStepState, setActiveStep } = useRnbwRewardsTransitionContext();

  return (
    <View style={[styles.stepsContainer, { paddingBottom: tabBarOffset }]}>
      {activeStepState === ClaimSteps.Introduction && <IntroductionStep />}
      {activeStepState === ClaimSteps.CheckingAirdrop && (
        <LoadingStep
          labels={['Calculating Rewards...', 'Checking Historical Activity...', 'Checking Eligibility...']}
          onComplete={() => setActiveStep(ClaimSteps.Claim)}
        />
      )}
      {activeStepState === ClaimSteps.Claim && <ClaimAirdropStep />}
      {activeStepState === ClaimSteps.ClaimingAirdrop && (
        <LoadingStep
          labels={['Claiming Airdrop...', 'Gathering Coins...']}
          onComplete={() => setActiveStep(ClaimSteps.AirdropClaimFinished)}
        />
      )}
      {activeStepState === ClaimSteps.AirdropClaimFinished && <AirdropClaimFinishedStep />}
      {activeStepState === ClaimSteps.NothingToClaim && <NothingToClaimStep />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stepsContainer: {
    flex: 1,
  },
});
