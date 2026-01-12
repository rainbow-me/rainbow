import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { IntroductionStep } from './steps/IntroductionStep';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/components/RnbwCoin';
import { RnbwClaimContextProvider, ClaimSteps, useRnbwClaimContext } from '@/features/rnbw-rewards/context/RnbwClaimContext';
import { CalculatingRewardsStep } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/steps/CalculatingRewardsStep';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/components/BottomGradientGlow';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/components/FloatingCoins';
import { ClaimRewardsStep } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/steps/ClaimRewardsStep';

export const RnbwClaimScreen = memo(function RnbwClaimScreen() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <RnbwClaimContextProvider>
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <View style={StyleSheet.absoluteFill}>
          <BottomGradientGlow />
          <FloatingCoins />
          <RnbwCoin />
        </View>
        <RnbwClaimScreenSteps />
      </View>
    </RnbwClaimContextProvider>
  );
});

function RnbwClaimScreenSteps() {
  const { activeStepState } = useRnbwClaimContext();

  return (
    <View style={{ flex: 1 }}>
      {activeStepState === ClaimSteps.Introduction && <IntroductionStep />}
      {activeStepState === ClaimSteps.CheckingAirdrop && <CalculatingRewardsStep />}
      {activeStepState === ClaimSteps.Claim && <ClaimRewardsStep />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
});
