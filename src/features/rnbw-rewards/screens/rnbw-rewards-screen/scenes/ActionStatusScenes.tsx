import { memo, useCallback } from 'react';
import { Alert } from 'react-native';
import { useRnbwRewardsFlowContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsFlowContext';
import { RnbwRewardsScenes } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { ActionStatusScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/ActionStatusScene';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { useRewardsFlowStore } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import * as i18n from '@/languages';

export function AirdropEligibilityScene() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const airdropData = useAirdropBalanceStore(state => state.getData());
  const airdropEligibilityRequest = useRewardsFlowStore(state => state.airdropEligibilityRequest);
  const labels = [
    i18n.t(i18n.l.rnbw_rewards.loading_labels.calculating_rewards),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.checking_historical_activity),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.checking_eligibility),
  ];

  const handleCheckAirdropEligibilityComplete = useCallback(() => {
    if (airdropData?.available.amountInDecimal === '0') {
      setActiveScene(RnbwRewardsScenes.AirdropUnavailable);
    } else {
      setActiveScene(RnbwRewardsScenes.AirdropClaimPrompt);
    }
  }, [setActiveScene, airdropData]);

  return <ActionStatusScene labels={labels} task={airdropEligibilityRequest} onComplete={handleCheckAirdropEligibilityComplete} />;
}

export const AirdropClaimingScene = memo(function AirdropClaimingScene() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const airdropClaimRequest = useRewardsFlowStore(state => state.airdropClaimRequest);
  const labels = [i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_airdrop), i18n.t(i18n.l.rnbw_rewards.loading_labels.gathering_coins)];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimAirdropComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
        setActiveScene(RnbwRewardsScenes.AirdropClaimPrompt);
        return;
      }
      setActiveScene(RnbwRewardsScenes.AirdropClaimed);
    },
    [setActiveScene, showClaimError]
  );

  return <ActionStatusScene labels={labels} task={airdropClaimRequest} onComplete={handleClaimAirdropComplete} />;
});

export const RewardsClaimingScene = memo(function RewardsClaimingScene() {
  const { setActiveScene } = useRnbwRewardsFlowContext();
  const rewardsClaimRequest = useRewardsFlowStore(state => state.rewardsClaimRequest);
  const labels = [i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_rewards), i18n.t(i18n.l.rnbw_rewards.loading_labels.gathering_coins)];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimRewardsComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
      }
      setActiveScene(RnbwRewardsScenes.RewardsOverview);
    },
    [setActiveScene, showClaimError]
  );

  return <ActionStatusScene labels={labels} task={rewardsClaimRequest} onComplete={handleClaimRewardsComplete} />;
});
