import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Box, Text, TextIcon } from '@/design-system';
import { RnbwRewardsScenes, RnbwRewardsScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/rewardsScenes';
import { ActionStatusScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/ActionStatusScene';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { AsyncActionState, useRewardsFlowStore, rewardsFlowActions } from '@/features/rnbw-rewards/stores/rewardsFlowStore';
import * as i18n from '@/languages';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwHeroCoin';
import { ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { time } from '@/utils/time';
import Animated from 'react-native-reanimated';
import { defaultEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';

const LONGER_THAN_USUAL_TIME = time.seconds(10);

export function AirdropEligibilityScene() {
  const hasClaimableAirdrop = useAirdropBalanceStore(state => state.hasClaimableAirdrop());
  const airdropEligibilityRequest = useRewardsFlowStore(state => state.airdropEligibilityRequest);
  const labels = [
    i18n.t(i18n.l.rnbw_rewards.loading_labels.checking_historical_activity),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.counting_your_points),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.oh_i_see),
  ];

  const handleCheckAirdropEligibilityComplete = useCallback(() => {
    if (hasClaimableAirdrop) {
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropClaimPrompt);
    } else {
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropUnavailable);
    }
  }, [hasClaimableAirdrop]);

  return (
    <ActionStatusSceneWithLongerThanUsual
      scene={RnbwRewardsScenes.AirdropEligibility}
      labels={labels}
      task={airdropEligibilityRequest}
      onComplete={handleCheckAirdropEligibilityComplete}
    />
  );
}

export const AirdropClaimingScene = memo(function AirdropClaimingScene() {
  const airdropClaimRequest = useRewardsFlowStore(state => state.airdropClaimRequest);
  const labels = [
    i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_airdrop),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.submitting_transaction),
  ];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimAirdropComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
        rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropClaimPrompt);
        return;
      }
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.AirdropClaimed);
    },
    [showClaimError]
  );

  return (
    <ActionStatusSceneWithLongerThanUsual
      scene={RnbwRewardsScenes.AirdropClaiming}
      labels={labels}
      task={airdropClaimRequest}
      onComplete={handleClaimAirdropComplete}
    />
  );
});

export const RewardsClaimingScene = memo(function RewardsClaimingScene() {
  const rewardsClaimRequest = useRewardsFlowStore(state => state.rewardsClaimRequest);
  const labels = [
    i18n.t(i18n.l.rnbw_rewards.loading_labels.claiming_rewards),
    i18n.t(i18n.l.rnbw_rewards.loading_labels.submitting_transaction),
  ];

  const showClaimError = useCallback(() => {
    Alert.alert(i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_title), i18n.t(i18n.l.rnbw_rewards.claim.claim_failed_message));
  }, []);

  const handleClaimRewardsComplete = useCallback(
    (taskStatus: 'success' | 'error') => {
      if (taskStatus === 'error') {
        showClaimError();
        rewardsFlowActions.setActiveScene(RnbwRewardsScenes.RewardsOverview);
        return;
      }
      rewardsFlowActions.setActiveScene(RnbwRewardsScenes.RewardsClaimed);
    },
    [showClaimError]
  );

  return (
    <ActionStatusSceneWithLongerThanUsual
      scene={RnbwRewardsScenes.RewardsClaiming}
      labels={labels}
      task={rewardsClaimRequest}
      onComplete={handleClaimRewardsComplete}
    />
  );
});

type ActionStatusSceneWithLongerThanUsualProps<T> = {
  scene: RnbwRewardsScene;
  labels: string[];
  task: AsyncActionState<T>;
  onComplete?: (taskStatus: 'success' | 'error') => void;
};

const ActionStatusSceneWithLongerThanUsual = memo(function ActionStatusSceneWithLongerThanUsual<T>({
  scene,
  labels,
  task,
  onComplete,
}: ActionStatusSceneWithLongerThanUsualProps<T>) {
  const shouldShowLongerThanUsualInfoCard = useLongerThanUsualInfoCard();

  return (
    <View style={[styles.contentContainer, { paddingTop: getCoinBottomPosition(scene) + 32 }]}>
      <ActionStatusScene labels={labels} task={task} onComplete={onComplete} />
      {shouldShowLongerThanUsualInfoCard && <LongerThanUsualInfoCard />}
    </View>
  );
});

function useLongerThanUsualInfoCard() {
  const [shouldShowLongerThanUsualInfoCard, setShouldShowLongerThanUsualInfoCard] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldShowLongerThanUsualInfoCard(true);
    }, LONGER_THAN_USUAL_TIME);
    return () => clearTimeout(timeout);
  }, []);

  return shouldShowLongerThanUsualInfoCard;
}

const LongerThanUsualInfoCard = memo(function LongerThanUsualInfoCard() {
  const backgroundColor = opacityWorklet(ETH_COLOR_DARK, 0.06);
  return (
    <Animated.View entering={defaultEnterAnimation} exiting={defaultExitAnimation}>
      <Box
        backgroundColor={backgroundColor}
        width={'full'}
        height={100}
        borderColor={{ custom: backgroundColor }}
        borderWidth={1}
        justifyContent="center"
        alignItems="center"
        borderRadius={32}
        padding={'24px'}
      >
        <Box flexDirection="row" alignItems="center" gap={12}>
          <TextIcon size="icon 21px" color="labelQuaternary" weight="bold">
            {'􀐫'}
          </TextIcon>
          <Text color="labelQuaternary" size="15pt / 135%" weight="bold">
            {i18n.t(i18n.l.rnbw_rewards.longer_than_usual)}
          </Text>
        </Box>
      </Box>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
});
