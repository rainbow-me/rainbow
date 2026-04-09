import { memo, useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import Animated from 'react-native-reanimated';

import { ETH_COLOR_DARK } from '@/__swaps__/screens/Swap/constants';
import { Box, Text, TextIcon } from '@/design-system';
import { getCoinBottomPosition } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/components/RnbwHeroCoin';
import { RnbwAirdropScenes } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/constants/airdropScenes';
import { airdropFlowActions, useAirdropFlowStore } from '@/features/rnbw-airdrop/stores/airdropFlowStore';
import { defaultEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { ActionStatusScene } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/scenes/ActionStatusScene';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { time } from '@/utils/time';

const LONGER_THAN_USUAL_TIME = time.seconds(10);

export const AirdropClaimingScene = memo(function AirdropClaimingScene() {
  const airdropClaimRequest = useAirdropFlowStore(state => state.airdropClaimRequest);
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
        airdropFlowActions.setActiveScene(RnbwAirdropScenes.AirdropClaimPrompt);
        return;
      }
      airdropFlowActions.setActiveScene(RnbwAirdropScenes.AirdropClaimed);
    },
    [showClaimError]
  );

  const shouldShowLongerThanUsualInfoCard = useLongerThanUsualInfoCard();

  return (
    <View style={[styles.contentContainer, { paddingTop: getCoinBottomPosition(RnbwAirdropScenes.AirdropClaiming) + 32 }]}>
      <ActionStatusScene labels={labels} task={airdropClaimRequest} onComplete={handleClaimAirdropComplete} />
      {shouldShowLongerThanUsualInfoCard && <LongerThanUsualInfoCard />}
    </View>
  );
});

function useLongerThanUsualInfoCard() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setShouldShow(true);
    }, LONGER_THAN_USUAL_TIME);
    return () => clearTimeout(timeout);
  }, []);

  return shouldShow;
}

const LongerThanUsualInfoCard = memo(function LongerThanUsualInfoCard() {
  const backgroundColor = opacity(ETH_COLOR_DARK, 0.06);
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
