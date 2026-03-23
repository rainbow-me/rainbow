import { memo, useCallback, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Separator, Stack, Text, useForegroundColor } from '@/design-system';
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
import { UNSTAKE_PENALTY_PERCENTAGE } from '../../constants';
import { useStableValue } from '@/hooks/useStableValue';
import rnbwCoinImage from '@/assets/rnbw.png';

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

  return (
    <View style={styles.content}>
      <Stack space="24px">
        <Stack space="24px" alignHorizontal="center">
          <UnstakePenaltySign />
          <Stack space="20px" alignHorizontal="center">
            <Text color="label" size="34pt" weight="heavy" align="center">
              {'Exit Fee'}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="semibold" align="center">
              {'Be aware of unstaking penalty. Earn yield, unlock swap discounts, and more.'}
            </Text>
          </Stack>
        </Stack>
        <Stack space="32px" alignHorizontal="center">
          <ButtonPressAnimation onPress={onProceed} style={{ width: '100%' }}>
            <Box
              backgroundColor={opacity(redColor, 0.2)}
              borderRadius={24}
              height={48}
              justifyContent="center"
              alignItems="center"
              width="full"
              borderColor={{ custom: opacity(redColor, 0.1) }}
              borderWidth={2}
            >
              <Text color={{ custom: redColor }} size="22pt" weight="heavy">
                {'I understand'}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <ButtonPressAnimation onPress={goBack}>
            <Text color="label" size="22pt" weight="heavy">
              {'Cancel'}
            </Text>
          </ButtonPressAnimation>
        </Stack>
      </Stack>
    </View>
  );
});

const UnstakeContent = memo(function UnstakeContent() {
  // We use the initial values only so we do not display 0 prior to the sheet being dismissed after unstaking.
  const { tokenAmount, nativeCurrencyAmount } = useStableValue(() => useRnbwStakingBalance.getState());
  const { exitFeeOffsetRatio, netPnl, isPositivePnl } = useStableValue(() => useRnbwStakingPositionPnl.getState());
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
      const error = ensureError(e);
      setIsProcessing(false);
      // TODO: For internal testing. Remove before production
      Alert.alert('Unstake Failed', error.message);
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
    <View style={styles.content}>
      <Stack space="44px">
        <Text color="label" size="20pt" weight="heavy" align="center">
          {`Unstake $${RNBW_SYMBOL}`}
        </Text>
        <Stack space="24px" alignHorizontal="center">
          <Image source={rnbwCoinImage} style={styles.coinImage} />
          <Stack space="12px" alignHorizontal="center">
            <Text color="label" size="44pt" weight="heavy" align="center">
              {nativeCurrencyAmount}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="bold" align="center">
              {`${tokenAmount} ${RNBW_SYMBOL}`}
            </Text>
          </Stack>
        </Stack>
      </Stack>
      <Box paddingHorizontal="16px" marginTop={{ custom: 48 }}>
        <Separator color="separator" thickness={1} />
        <Stack separator={<Separator color="separator" thickness={1} />}>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Exit Penalty'}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${UNSTAKE_PENALTY_PERCENTAGE}%`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'Exit Fee Recovered'}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {exitFeeOffsetRatio}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {'PnL'}
            </Text>
            <Text color={isPositivePnl ? 'green' : 'red'} size="17pt" weight="bold">
              {`${netPnl} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
        </Stack>
      </Box>
      <Box marginTop={{ custom: 24 }}>
        <HoldToActivateButton
          label="Hold to Unstake"
          processingLabel="Unstaking..."
          onLongPress={handleUnstake}
          isProcessing={isProcessing}
          backgroundColor="white"
          disabledBackgroundColor="white"
          progressColor="black"
          showBiometryIcon
          style={styles.holdButton}
        />
      </Box>
    </View>
  );
});

const styles = StyleSheet.create({
  content: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    paddingTop: 44,
  },
  holdButton: {
    width: '100%',
  },
  coinImage: {
    width: 80,
    height: 80,
  },
});
