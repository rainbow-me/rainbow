import { memo } from 'react';
import { StyleSheet } from 'react-native';

import Animated from 'react-native-reanimated';

import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { Box, Text } from '@/design-system';
import { getCoinBottomPosition } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/components/RnbwHeroCoin';
import { RnbwAirdropScenes } from '@/features/rnbw-airdrop/screens/rnbw-airdrop-screen/constants/airdropScenes';
import { createScaleInFadeInSlideEnterAnimation, defaultExitAnimation } from '@/features/rnbw-rewards/animations/sceneTransitions';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useAirdropBalanceStore } from '@/features/rnbw-rewards/stores/airdropBalanceStore';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: -24 });
const exitingAnimation = defaultExitAnimation;

export const AirdropClaimedScene = memo(function AirdropClaimedScene() {
  const { tokenAmount } = useAirdropBalanceStore(state => state.getFormattedAirdroppedBalance());
  const { goBack } = useNavigation();

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <Box
        gap={24}
        alignItems="center"
        style={[styles.claimInfoContainer, { top: getCoinBottomPosition(RnbwAirdropScenes.AirdropClaimed) + 20 }]}
      >
        <Text color="label" size="30pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.airdrop_claimed)}
        </Text>
        <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
          {i18n.t(i18n.l.rnbw_rewards.airdrop_claim_finished.you_claimed)}
          <Text color="label" size="17pt" weight="bold" align="center">
            {` ${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Text>
      </Box>
      <ButtonPressAnimation onPress={goBack} scaleTo={0.96} style={styles.button}>
        <Box
          backgroundColor={opacity('#F5F8FF', 0.06)}
          width="full"
          height={52}
          borderRadius={26}
          justifyContent="center"
          alignItems="center"
          borderColor={'separatorTertiary'}
          borderWidth={1}
        >
          <Text color="label" size="22pt" weight="heavy" align="center">
            {i18n.t(i18n.l.button.done)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  claimInfoContainer: {
    position: 'absolute',
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '100%',
    paddingHorizontal: 42,
  },
});
