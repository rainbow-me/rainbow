import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Box, globalColors, Text, useColorMode } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import * as i18n from '@/languages';
import { ClaimSteps, useRnbwClaimContext } from '@/features/rnbw-rewards/context/RnbwClaimContext';
import Animated from 'react-native-reanimated';
import { time } from '@/utils/time';
import { useTabBarOffset } from '@/hooks/useTabBarOffset';
import { createScaleInFadeInSlideUpEnterAnimation } from '@/features/rnbw-rewards/animations/layoutAnimations';
import { getCoinBottomPosition } from '@/features/rnbw-rewards/screens/rnbw-claim-screen/components/RnbwCoin';
import { formatCurrency, formatNumber } from '@/helpers/strings';

const customEnteringAnimation = createScaleInFadeInSlideUpEnterAnimation(time.ms(200));

export const ClaimRewardsStep = memo(function ClaimRewardsStep() {
  const { isDarkMode } = useColorMode();
  const { setActiveStep } = useRnbwClaimContext();
  const tabBarOffset = useTabBarOffset();
  const availableToClaim = 560.1234451;
  const availableToClaimNativeCurrency = 1234.56;

  return (
    <View style={[styles.container, { paddingBottom: tabBarOffset + 32 }]}>
      <Animated.View
        entering={customEnteringAnimation}
        style={{ position: 'absolute', top: getCoinBottomPosition(ClaimSteps.Claim) + 32, width: '100%' }}
      >
        <Box gap={16} alignItems="center" width="full">
          <Text size="22pt" weight="heavy" color="labelQuaternary" align="center">
            {i18n.t(i18n.l.rnbw_rewards.claim.available_to_claim)}
          </Text>
          <Text size="20pt" weight="heavy" color="label" align="center" style={{ fontSize: 64, lineHeight: 72 }}>
            {formatCurrency(availableToClaimNativeCurrency)}
          </Text>
          <Text size="20pt" weight="bold" color={availableToClaim > 0 ? 'label' : 'labelQuaternary'} align="center">
            {`${formatNumber(availableToClaim, { decimals: 2 })} RNBW`}
          </Text>
        </Box>
      </Animated.View>
      <Box gap={24} alignItems="center" paddingHorizontal={{ custom: 40 }}>
        <Animated.View entering={customEnteringAnimation}>
          <Text color={{ custom: '#989A9E' }} size="17pt / 150%" weight="semibold" align="center">
            {"Based on Your Swaps and the 45,788 Rainbow Points you've Earned Over Time. You're Ranked #4,566 on the Leaderboard."}
          </Text>
        </Animated.View>
        <Animated.View entering={customEnteringAnimation}>
          <ButtonPressAnimation
            style={[styles.button, { backgroundColor: isDarkMode ? globalColors.white100 : globalColors.grey100 }]}
            onPress={() => {
              'worklet';
              setActiveStep(ClaimSteps.Introduction);
            }}
          >
            <Text color="black" size="22pt" weight="heavy">
              {'Hold to claim'}
            </Text>
          </ButtonPressAnimation>
        </Animated.View>
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    height: 51,
    width: 250,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
