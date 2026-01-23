import { memo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { LoadingStep } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/steps/LoadingStep';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { useRnbwRewardsFlowStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsFlowStore';
import * as i18n from '@/languages';

export function CheckingAirdropLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const airdropData = useRnbwAirdropStore(state => state.getData());
  const checkingAirdrop = useRnbwRewardsFlowStore(state => state.checkingAirdrop);
  const labels = [
    i18n.t(i18n.l.rnbw_rewards.loading_labels.calculating_rewards),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.checking_historical_activity),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.checking_eligibility),
  ];

  const handleCheckAirdropEligibilityComplete = useCallback(() => {
    if (airdropData?.available.amountInDecimal === '0') {
      setActiveStep(ClaimSteps.NoAirdropToClaim);
    } else {
      setActiveStep(ClaimSteps.ClaimAirdrop);
    }
  }, [setActiveStep, airdropData]);

  return <LoadingStep labels={labels} task={checkingAirdrop} onComplete={handleCheckAirdropEligibilityComplete} />;
}

export const ClaimingAirdropLoadingStep = memo(function ClaimingAirdropLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const claimAirdropTask = useRnbwRewardsFlowStore(state => state.claimAirdrop);
  const labels = [i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_airdrop), i18n.t(i18n.l.rnbw_rewards.loading_labels.gathering_coins)];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimAirdropComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
        setActiveStep(ClaimSteps.ClaimAirdrop);
        return;
      }
      setActiveStep(ClaimSteps.ClaimAirdropFinished);
    },
    [setActiveStep, showClaimError]
  );

  return <LoadingStep labels={labels} task={claimAirdropTask} onComplete={handleClaimAirdropComplete} />;
});

export const ClaimingRewardsLoadingStep = memo(function ClaimingRewardsLoadingStep() {
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const claimRewardsTask = useRnbwRewardsFlowStore(state => state.claimRewards);
  const labels = [i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_rewards), i18n.t(i18n.l.rnbw_rewards.loading_labels.gathering_coins)];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimRewardsComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
      }
      setActiveStep(ClaimSteps.Rewards);
    },
    [setActiveStep, showClaimError]
  );

  return <LoadingStep labels={labels} task={claimRewardsTask} onComplete={handleClaimRewardsComplete} />;
});
