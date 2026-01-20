import { memo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, TextIcon, useColorMode } from '@/design-system';
import * as i18n from '@/languages';
import { ClaimSteps, useRnbwRewardsTransitionContext } from '@/features/rnbw-rewards/context/RnbwRewardsTransitionContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import {
  createScaleOutFadeOutSlideExitAnimation,
  createScaleInFadeInSlideEnterAnimation,
} from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-airdrop-screen/components/RnbwCoin';
import { formatCurrency, formatNumber } from '@/helpers/strings';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { ButtonPressAnimation } from '@/components/animations';

const enteringAnimation = createScaleInFadeInSlideEnterAnimation({ translateY: 24, delay: time.ms(200) });
const exitingAnimation = createScaleOutFadeOutSlideExitAnimation();

export const ClaimAirdropStep = memo(function ClaimAirdropStep() {
  const { isDarkMode } = useColorMode();
  const { setActiveStep } = useRnbwRewardsTransitionContext();

  const [isClaiming, setIsClaiming] = useState(false);

  const handleClaimLater = () => {
    'worklet';
    setActiveStep(ClaimSteps.NothingToClaim);
  };

  // TODO: testing values
  const availableToClaim = 560.1234451;
  const availableToClaimNativeCurrency = 1234.56;

  return (
    <Animated.View style={styles.container} entering={enteringAnimation} exiting={exitingAnimation}>
      <View style={styles.amountContainer}>
        <Box gap={16} alignItems="center" width="full">
          <Text size="22pt" weight="heavy" color="labelQuaternary" align="center">
            {i18n.t(i18n.l.rnbw_rewards.claim.your_airdrop).toUpperCase()}
          </Text>
          <Text size="20pt" weight="heavy" color="label" align="center" style={{ fontSize: 64, lineHeight: 72 }}>
            {formatCurrency(availableToClaimNativeCurrency)}
          </Text>
          <Text size="20pt" weight="bold" color={availableToClaim > 0 ? 'label' : 'labelQuaternary'} align="center">
            {`${formatNumber(availableToClaim, { decimals: 2 })} RNBW`}
          </Text>
        </Box>
      </View>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
          {"Based on Your Swaps and the 45,788 Rainbow Points you've Earned Over Time. You're Ranked #4,566 on the Leaderboard."}
        </Text>
        <Box gap={28}>
          <HoldToActivateButton
            label="Hold to Claim"
            onLongPress={() => {
              'worklet';
              // setIsClaiming(true);
              setActiveStep(ClaimSteps.ClaimingAirdrop);
              // setTimeout(() => {
              //   setActiveStep(ClaimSteps.NothingToClaim);
              //   setIsClaiming(false);
              // }, 500);
            }}
            backgroundColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            disabledBackgroundColor={isDarkMode ? globalColors.white100 : globalColors.grey100}
            disabled={isClaiming}
            isProcessing={isClaiming}
            processingLabel="Claiming..."
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
                {'Claim Later'}
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
    top: getCoinBottomPosition(ClaimSteps.Claim) + 32,
    width: '100%',
  },
});
