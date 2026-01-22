import { memo, useCallback, useMemo } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
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
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
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
import { useHasCompletedAirdrop } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/hooks/useHasCompletedAirdrop';
import { Box, Text } from '@/design-system';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import rnbwCoinImage from '@/assets/rnbw.png';

export const RnbwRewardsScreen = memo(function RnbwRewardsScreen() {
  const [hasCompletedAirdropFlow] = useHasCompletedAirdrop();

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
  const { scrollOffset, activeStepState } = useRnbwRewardsTransitionContext();
  const tabBarOffset = useTabBarOffset();
  const safeAreaInsets = useSafeAreaInsets();

  const rnbwCoinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollOffset.value }],
    };
  }, [scrollOffset]);

  const navbarTitle = useMemo(() => {
    return activeStepState === ClaimSteps.Rewards ? 'Rewards' : '';
  }, [activeStepState]);

  const navbarRightComponent = useMemo(() => {
    return activeStepState === ClaimSteps.Rewards ? <NavbarRnbwBalance /> : null;
  }, [activeStepState]);

  return (
    <View style={styles.flex}>
      <Navbar title={navbarTitle} leftComponent={<AccountImage />} rightComponent={navbarRightComponent} floating />
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
  const { activeStepState } = useRnbwRewardsTransitionContext();

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

const ClaimingAirdropLoadingStep = memo(function ClaimingAirdropLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const address = useWalletsStore(state => state.accountAddress);
  const nativeCurrency = userAssetsStoreManager(state => state.currency);
  const messageToSign = useRnbwAirdropStore(state => state.getMessageToSign());

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const claimAirdropTask = useCallback(() => {
    return claimAirdrop({ message: messageToSign ?? '', address, currency: nativeCurrency });
  }, [address, nativeCurrency, messageToSign]);

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
});

const ClaimingRewardsLoadingStep = memo(function ClaimingRewardsLoadingStep() {
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

  return (
    <LoadingStep labels={['Claiming Rewards...', 'Gathering Coins...']} task={claimRewardsTask} onComplete={handleClaimRewardsComplete} />
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D0D',
  },
  flex: {
    flex: 1,
  },
});
