import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { IntroductionStep } from './steps/IntroductionStep';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';
import { RnbwAirdropContextProvider, ClaimSteps, useRnbwAirdropContext } from '@/features/rnbw-rewards/context/RnbwAirdropContext';
import { CheckingAirdropStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/CheckingAirdropStep';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/BottomGradientGlow';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/FloatingCoins';
import { ClaimAirdropStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/ClaimAirdropStep';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { NothingToClaimStep } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/steps/NothingToClaimStep';
import { Navbar } from '@/components/navbar/Navbar';
import { AccountImage } from '@/components/AccountImage';

export const RnbwAirdropScreen = memo(function RnbwAirdropScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  return (
    <RnbwAirdropContextProvider>
      <View style={[styles.container, { paddingTop: safeAreaInsets.top }]}>
        <View style={StyleSheet.absoluteFill}>
          <BottomGradientGlow />
          <RnbwCoin />
          <FloatingCoins />
        </View>
        <Navbar floating leftComponent={<AccountImage />} />
        <RnbwAirdropScreenSteps />
      </View>
    </RnbwAirdropContextProvider>
  );
});

function RnbwAirdropScreenSteps() {
  const tabBarOffset = useTabBarOffset();
  const { activeStepState } = useRnbwAirdropContext();

  return (
    <View style={[styles.stepsContainer, { paddingBottom: tabBarOffset }]}>
      {activeStepState === ClaimSteps.Introduction && <IntroductionStep />}
      {activeStepState === ClaimSteps.CheckingAirdrop && <CheckingAirdropStep />}
      {activeStepState === ClaimSteps.Claim && <ClaimAirdropStep />}
      {activeStepState === ClaimSteps.NothingToClaim && <NothingToClaimStep />}
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
