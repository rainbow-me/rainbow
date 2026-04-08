import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, globalColors, Separator, Stack, Text, useForegroundColor } from '@/design-system';
import { ensureError, logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { useAccountAddress, useIsHardwareWallet, useIsReadOnlyWallet } from '@/state/wallets/walletsStore';
import watchingAlert from '@/utils/watchingAlert';
import { unstakeRnbw } from '../../utils/unstakeRnbw';
import { UnstakePenaltySign } from '@/features/rnbw-staking/components/UnstakePenaltySign';
import { opacity } from '@/framework/ui/utils/opacity';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { useRnbwStakingBalance } from '../../stores/derived/useRnbwStakingBalance';
import { useRnbwStakingPositionPnl } from '../../stores/derived/useRnbwStakingPositionPnl';
import { useStakingPositionStore } from '../../stores/rnbwStakingPositionStore';
import { useStableValue } from '@/hooks/useStableValue';
import { LinearGradient } from 'expo-linear-gradient';
import { RnbwCoinIcon } from '@/components/RnbwCoinIcon';
import { RnbwHoldToActivateButton } from '@/features/rnbw-membership/components/RnbwHoldToActivateButton';

const LAYOUT_ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;
const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(LAYOUT_ANIMATION_CONFIG.mass)
  .damping(LAYOUT_ANIMATION_CONFIG.damping)
  .stiffness(LAYOUT_ANIMATION_CONFIG.stiffness);

export const RnbwUnstakeSheet = memo(function RnbwUnstakeSheet() {
  const [step, setStep] = useState<'warning' | 'unstake'>('warning');

  const handleProceedToUnstake = useCallback(() => {
    setStep('unstake');
  }, []);

  return (
    <PanelSheet layoutAnimation={LAYOUT_ANIMATION}>
      {step === 'warning' && <WarningContent onProceed={handleProceedToUnstake} />}
      {step === 'unstake' && <UnstakeContent />}
    </PanelSheet>
  );
});

const WarningContent = memo(function WarningContent({ onProceed }: { onProceed: () => void }) {
  const { goBack } = useNavigation();
  const redColor = useForegroundColor('red');
  const exitFeePercentage = useStakingPositionStore(s => s.getExitFeePercentage());

  return (
    <View style={styles.warningContentContainer}>
      <Stack space="32px">
        <Stack space="24px" alignHorizontal="center">
          <UnstakePenaltySign percentage={exitFeePercentage} />
          <Stack space="20px" alignHorizontal="center">
            <Text color="label" size="34pt" weight="heavy" align="center">
              {'Exit Fee'}
            </Text>
            <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
              {`Unstaking will charge a ${exitFeePercentage}% fee to your staked balance.`}
            </Text>
          </Stack>
        </Stack>
        <Stack space="16px" alignHorizontal="center">
          <ButtonPressAnimation onPress={onProceed} style={styles.fullWidthButton} wrapperStyle={styles.fullWidthButton} scaleTo={0.96}>
            <Box
              borderRadius={24}
              height={48}
              justifyContent="center"
              alignItems="center"
              width="full"
              borderColor={{ custom: opacity(redColor, 0.1) }}
              borderWidth={2}
            >
              <LinearGradient
                colors={[opacity(globalColors.red60, 0.16), opacity('#E72E28', 0.16)]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <Text color={{ custom: globalColors.red60 }} size="22pt" weight="heavy">
                {'Confirm Unstake'}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <Box height={48} justifyContent="center" alignItems="center">
            <ButtonPressAnimation onPress={goBack}>
              <Text color="label" size="22pt" weight="heavy">
                {'Keep Staking'}
              </Text>
            </ButtonPressAnimation>
          </Box>
        </Stack>
      </Stack>
    </View>
  );
});

const UnstakeContent = memo(function UnstakeContent() {
  // We use the initial values only so we do not display 0 prior to the sheet being dismissed after unstaking.
  const { tokenAmount, nativeCurrencyAmount } = useStableValue(() => useRnbwStakingBalance.getState());
  const { exitFeeOffsetRatioDisplay, netPnl, isPositivePnl, rnbwAfterUnstake } = useStableValue(() => useRnbwStakingPositionPnl.getState());
  const exitFeePercentage = useStableValue(() => useStakingPositionStore.getState().getExitFeePercentage());
  const { goBack, navigate } = useNavigation();
  const accountAddress = useAccountAddress();
  const isReadOnlyWallet = useIsReadOnlyWallet();
  const isHardwareWallet = useIsHardwareWallet();
  const [isProcessing, setIsProcessing] = useState(false);

  const startUnstake = useCallback(async () => {
    setIsProcessing(true);
    try {
      await unstakeRnbw({ address: accountAddress });
      goBack();
    } catch (e) {
      setIsProcessing(false);
      Alert.alert('Unstake Failed', 'An error occurred while unstaking your RNBW. Please try again.');
      const error = ensureError(e);
      logger.error(new RainbowError('[RnbwUnstakeSheet]: Unstake failed', error));
    }
  }, [accountAddress, goBack]);

  const handleUnstake = useCallback(async () => {
    if (isReadOnlyWallet) {
      watchingAlert();
      return;
    }

    if (isHardwareWallet) {
      navigate(Routes.HARDWARE_WALLET_TX_NAVIGATOR, { submit: startUnstake });
    } else {
      await startUnstake();
    }
  }, [isHardwareWallet, isReadOnlyWallet, navigate, startUnstake]);

  return (
    <View style={styles.unstakeContentContainer}>
      <Stack space="44px">
        <Text color="label" size="20pt" weight="heavy" align="center">
          {`Unstake $${RNBW_SYMBOL}`}
        </Text>
        <Stack space="24px" alignHorizontal="center">
          <RnbwCoinIcon size={80} />
          <Stack space="12px" alignHorizontal="center">
            <Text color="label" size="44pt" weight="heavy" align="center">
              {tokenAmount}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="bold" align="center">
              {nativeCurrencyAmount}
            </Text>
          </Stack>
        </Stack>
      </Stack>
      <Box paddingHorizontal="16px" marginTop={{ custom: 48 }}>
        <Separator color="separatorTertiary" thickness={1} />
        <Stack separator={<Separator color="separatorTertiary" thickness={1} />}>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Exit Fee'}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${exitFeePercentage}%`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Loyalty Progress'}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${exitFeeOffsetRatioDisplay}`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Receive'}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${rnbwAfterUnstake} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Total Return'}
            </Text>
            <Text color={isPositivePnl ? 'green' : 'red'} size="17pt" weight="bold">
              {`${netPnl} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
        </Stack>
      </Box>
      <Box marginTop={{ custom: 32 }}>
        <RnbwHoldToActivateButton
          label="Hold to Unstake"
          processingLabel="Unstaking..."
          onActivate={handleUnstake}
          isProcessing={isProcessing}
          showBiometryIcon
          style={styles.fullWidthButton}
        />
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  warningContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 52,
  },
  unstakeContentContainer: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 33,
  },
  fullWidthButton: {
    width: '100%',
  },
});
