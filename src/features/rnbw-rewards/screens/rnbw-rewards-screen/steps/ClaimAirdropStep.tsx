import { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ClaimSteps } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/constants/claimSteps';
import { useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/context/RnbwRewardsTransitionContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { defaultExitAnimation, createScaleInFadeInSlideEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/components/RnbwCoin';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { ButtonPressAnimation } from '@/components/animations';
import { useRnbwAirdropStore } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwAirdropStore';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { rnbwRewardsFlowActions } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/stores/rnbwRewardsFlowStore';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: 24, delay: time.ms(200) });

export const ClaimAirdropStep = memo(function ClaimAirdropStep() {
  const { isDarkMode } = useColorMode();
  const { setActiveStep } = useRnbwRewardsTransitionContext();
  const { tokenAmount, nativeCurrencyAmount } = useRnbwAirdropStore(state => state.getFormattedBalance());
  const hasClaimableAirdrop = useRnbwAirdropStore(state => state.hasClaimableAirdrop());

  const handleClaimLater = () => {
    'worklet';
    setActiveStep(ClaimSteps.Rewards);
  };

  const handleClaimAirdrop = () => {
    'worklet';
    rnbwRewardsFlowActions.startClaimAirdrop();
    setActiveStep(ClaimSteps.ClaimingAirdrop);
  };

  const claimAirdropDescription = useMemo(() => {
    // TODO: confirm this is the description we want to use
    return i18n.t(i18n.l.rnbw_rewards.claim.based_on_your_swaps, {
      points: '45,788',
      rank: '4,566',
    });
  }, []);

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={defaultExitAnimation}>
      <View style={styles.amountContainer}>
        <Box gap={16} alignItems="center" width="full">
          <Text size="22pt" weight="heavy" color="labelQuaternary" align="center">
            {i18n.t(i18n.l.rnbw_rewards.claim.your_airdrop).toUpperCase()}
          </Text>
          <Text size="20pt" weight="heavy" color="label" align="center" style={{ fontSize: 64, lineHeight: 72 }}>
            {nativeCurrencyAmount}
          </Text>
          <Text size="20pt" weight="bold" color={hasClaimableAirdrop ? 'label' : 'labelQuaternary'} align="center">
            {`${tokenAmount} ${RNBW_SYMBOL}`}
          </Text>
        </Box>
      </View>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
          {claimAirdropDescription}
        </Text>
        <Box gap={28}>
          <HoldToActivateButton
            label={i18n.t(i18n.l.button.hold_to_authorize.hold_to_claim)}
            onLongPress={handleClaimAirdrop}
            backgroundColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            disabledBackgroundColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            disabled={false}
            isProcessing={false}
            processingLabel={i18n.t(i18n.l.button.hold_to_authorize.claiming)}
            showBiometryIcon={false}
            progressColor="black"
            style={styles.button}
            size="22pt"
            weight="black"
            color="black"
            textStyle={{ color: 'black', fontSize: 24, fontWeight: '900' }}
          />
          <ButtonPressAnimation onPress={handleClaimLater} scaleTo={0.96}>
            <Box flexDirection="row" gap={8} alignItems="center" justifyContent="center">
              <Text color="labelTertiary" size="17pt" weight="bold" align="center">
                {i18n.t(i18n.l.rnbw_rewards.claim.claim_later)}
              </Text>
              <TextIcon color="labelQuaternary" size="icon 13px" weight="bold" align="center">
                {'􀆊'}
              </TextIcon>
            </Box>
          </ButtonPressAnimation>
        </Box>
      </Box>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
  },
  button: {
    height: 51,
    width: 260,
    borderRadius: 26,
  },
  amountContainer: {
    position: 'absolute',
    top: getCoinBottomPosition(ClaimSteps.ClaimAirdrop) + 32,
    width: '100%',
  },
});
