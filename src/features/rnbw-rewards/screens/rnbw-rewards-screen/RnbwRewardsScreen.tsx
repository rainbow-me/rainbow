import { memo, useCallback, useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AccountImage } from '@/components/AccountImage';
import { BottomGradientGlow } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/BottomGradientGlow';
import { RnbwCoin } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { FloatingCoins } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/FloatingCoins';
import { LoadingStep, LoadingStepResult } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/LoadingStep';
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
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { claimRewards } from '@/features/rnbw-rewards/utils/claimRewards';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import * as i18n from '@/languages';
import { claimAirdrop } from '@/features/rnbw-rewards/utils/claimAirdrop';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { delay } from '@/utils/delay';
import { time } from '@/utils/time';
import { NoAirdropToClaimStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/NoAirdropToClaimStep';
import { useMMKVBoolean } from 'react-native-mmkv';
import { HAS_COMPLETED_AIRDROP_FLOW_KEY } from '@/features/rnbw-rewards/constants';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const [hasCompletedAirdropFlow] = useMMKVBoolean(HAS_COMPLETED_AIRDROP_FLOW_KEY);

  const initialStep = useMemo(() => {
    return hasCompletedAirdropFlow ? ClaimSteps.Rewards : ClaimSteps.AirdropIntroduction;
  }, [hasCompletedAirdropFlow]);

  return (
    <RnbwRewardsTransitionContextProvider initialStep={initialStep}>
      <View style={styles.container}>
        <RnbwRewardsContent />
      </View>
    </RnbwRewardsTransitionContextProvider>
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
    <View style={[{ flex: 1, paddingTop: safeAreaInsets.top, paddingBottom: tabBarOffset }]}>
      <View style={[StyleSheet.absoluteFill, { top: safeAreaInsets.top }]}>
        <BottomGradientGlow />
        <Animated.View style={rnbwCoinAnimatedStyle}>
          <RnbwCoin />
        </Animated.View>
        <FloatingCoins />
      </View>
      <Navbar leftComponent={<AccountImage />} floating />
      <RnbwRewardsSceneSteps />
    </View>
  );
}

function RnbwRewardsSceneSteps() {
  const { activeStepState } = useRnbwRewardsTransitionContext();

  return (
    <View style={styles.stepsContainer}>
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

function CheckingAirdropLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const airdropData = useRnbwAirdropStore(state => state.getData());

  const checkAirdropEligibilityTask = useCallback(async () => {
    // We already have fetched the airdrop data, this is purely visual
    await delay(time.seconds(1));
  }, []);

  const handleCheckAirdropEligibilityComplete = useCallback(() => {
    if (airdropData?.available.amountInDecimal === '0') {
      setActiveStep(ClaimSteps.NoAirdropToClaim);
    } else {
      setActiveStep(ClaimSteps.ClaimAirdrop);
    }
  }, [setActiveStep, airdropData]);

  return (
    <LoadingStep
      labels={['Calculating Rewards...', 'Checking Historical Activity...', 'Checking Eligibility...']}
      task={checkAirdropEligibilityTask}
      onComplete={handleCheckAirdropEligibilityComplete}
    />
  );
}

function ClaimingAirdropLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const address = useWalletsStore(state => state.accountAddress);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const airdropData = useRnbwAirdropStore(state => state.getData());

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const claimAirdropTask = useCallback(() => {
    return claimAirdrop({ message: airdropData?.message ?? '', address, currency: nativeCurrency });
  }, [address, nativeCurrency, airdropData]);

  const handleClaimAirdropComplete = useCallback(
    (result: LoadingStepResult<Awaited<ReturnType<typeof claimAirdrop>>>) => {
      if (result.status === 'error') {
        showClaimError();
        setActiveStep(ClaimSteps.ClaimAirdrop);
        return;
      }
      setActiveStep(ClaimSteps.ClaimAirdropFinished);
    },
    [setActiveStep, showClaimError]
  );

  return (
    <LoadingStep labels={['Claiming Airdrop...', 'Gathering Coins...']} task={claimAirdropTask} onComplete={handleClaimAirdropComplete} />
  );
}

function ClaimingRewardsLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const address = useWalletsStore(state => state.accountAddress);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const claimRewardsTask = useCallback(() => {
    return claimRewards({ address, currency: nativeCurrency });
  }, [address, nativeCurrency]);

  const handleClaimRewardsComplete = useCallback(
    (result: LoadingStepResult<Awaited<ReturnType<typeof claimRewards>>>) => {
      if (result.status === 'error') {
        showClaimError();
      }
      setActiveStep(ClaimSteps.Rewards);
    },
    [setActiveStep, showClaimError]
  );

  return <LoadingStep labels={['Claiming Rewards...']} task={claimRewardsTask} onComplete={handleClaimRewardsComplete} />;
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
