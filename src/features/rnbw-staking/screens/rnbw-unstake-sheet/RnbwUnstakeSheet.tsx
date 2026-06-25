import { memo, useCallback, useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { destroyStore } from '@storesjs/stores';
import { LinearGradient } from 'expo-linear-gradient';
import { LinearTransition } from 'react-native-reanimated';

import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { RnbwCoinIcon } from '@/components/RnbwCoinIcon';
import { Box, globalColors, Separator, Stack, Text, useForegroundColor } from '@/design-system';
import { useRemoteConfig } from '@/features/config/stores/remoteConfig';
import { SmartWalletActivationCallout } from '@/features/delegation/components/SmartWalletActivationCallout';
import { createPreparedCallsStore, type PreparedCallsStore } from '@/features/delegation/stores/preparedCallsStore';
import { predictSponsoredCallsExecution } from '@/features/delegation/utils/sponsoredCalls';
import { useGasSettings } from '@/features/gas/hooks/useSelectedGas';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { buildGasParams } from '@/features/gas/utils/parseGas';
import { RnbwHoldToActivateButton } from '@/features/rnbw-membership/components/RnbwButton/RnbwHoldToActivateButton';
import { RNBW_SYMBOL } from '@/features/rnbw-rewards/constants';
import { UnstakePenaltySign } from '@/features/rnbw-staking/components/UnstakePenaltySign';
import { LoadingSpinner } from '@/framework/ui/components/LoadingSpinner';
import { opacity } from '@/framework/ui/utils/opacity';
import { useCleanup } from '@/hooks/useCleanup';
import { useStableValue } from '@/hooks/useStableValue';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import { useNavigation } from '@/navigation/Navigation';
import { useAccountAddress } from '@/state/wallets/walletsStore';

import { STAKING_CHAIN_ID } from '../../constants';
import { useRnbwStakingBalance } from '../../stores/derived/useRnbwStakingBalance';
import { useRnbwStakingPositionPnl } from '../../stores/derived/useRnbwStakingPositionPnl';
import { useStakingPositionStore } from '../../stores/rnbwStakingPositionStore';
import { prepareUnstakeRnbw, type PreparedUnstakeRnbw, type UnstakeRnbwPreparationParams } from '../../utils/prepareUnstakeRnbw';
import { unstakeRnbw } from '../../utils/unstakeRnbw';

type UnstakePreparationStore = PreparedCallsStore<PreparedUnstakeRnbw, UnstakeRnbwPreparationParams>;

const LAYOUT_ANIMATION_CONFIG = SPRING_CONFIGS.snappierSpringConfig;
const LAYOUT_ANIMATION = LinearTransition.springify()
  .mass(LAYOUT_ANIMATION_CONFIG.mass)
  .damping(LAYOUT_ANIMATION_CONFIG.damping)
  .stiffness(LAYOUT_ANIMATION_CONFIG.stiffness);

export const RnbwUnstakeSheet = memo(function RnbwUnstakeSheet() {
  const labelSecondaryColor = useForegroundColor('labelSecondary');
  const [step, setStep] = useState<'warning' | 'unstake'>('warning');
  const exitFeePercentage = useStakingPositionStore(s => s.getExitFeePercentage());
  const showSkeleton = exitFeePercentage === undefined;
  const unstakePreparationStore = useStableValue(() => createPreparedCallsStore(prepareUnstakeRnbw));

  useCleanup(() => {
    destroyStore(unstakePreparationStore, { clearQueryCache: true });
  }, [unstakePreparationStore]);

  const handleProceedToUnstake = useCallback(() => {
    setStep('unstake');
  }, []);

  return (
    <PanelSheet layoutAnimation={LAYOUT_ANIMATION}>
      {showSkeleton ? (
        <Box alignItems="center" justifyContent="center" height={400}>
          <LoadingSpinner color={labelSecondaryColor} size={40} />
        </Box>
      ) : (
        <>
          {step === 'warning' && <WarningContent exitFeePercentage={exitFeePercentage} onProceed={handleProceedToUnstake} />}
          {step === 'unstake' && <UnstakeContent exitFeePercentage={exitFeePercentage} unstakePreparationStore={unstakePreparationStore} />}
        </>
      )}
    </PanelSheet>
  );
});

const WarningContent = memo(function WarningContent({
  exitFeePercentage,
  onProceed,
}: {
  exitFeePercentage: number;
  onProceed: () => void;
}) {
  const { goBack } = useNavigation();
  const redColor = useForegroundColor('red');

  return (
    <View style={styles.warningContentContainer}>
      <Stack space="32px">
        <Stack space="24px" alignHorizontal="center">
          <UnstakePenaltySign percentage={exitFeePercentage} />
          <Stack space="20px" alignHorizontal="center">
            <Text color="label" size="34pt" weight="heavy" align="center">
              {i18n.t(i18n.l.rnbw_staking.unstake_sheet.exit_fee)}
            </Text>
            <Text color="labelTertiary" size="17pt / 135%" weight="semibold" align="center">
              {i18n.t(i18n.l.rnbw_staking.unstake_sheet.warning_description, { exitFeePercentage })}
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
                {i18n.t(i18n.l.button.continue)}
              </Text>
            </Box>
          </ButtonPressAnimation>
          <Box height={48} justifyContent="center" alignItems="center">
            <ButtonPressAnimation onPress={goBack}>
              <Text color="label" size="22pt" weight="heavy">
                {i18n.t(i18n.l.button.cancel)}
              </Text>
            </ButtonPressAnimation>
          </Box>
        </Stack>
      </Stack>
    </View>
  );
});

const UnstakeContent = memo(function UnstakeContent({
  exitFeePercentage,
  unstakePreparationStore,
}: {
  exitFeePercentage: number;
  unstakePreparationStore: UnstakePreparationStore;
}) {
  const { tokenAmount, nativeCurrencyAmount } = useRnbwStakingBalance();
  const { netPnl, isPositivePnl, rnbwAfterUnstake } = useRnbwStakingPositionPnl();
  const { goBack } = useNavigation();
  const accountAddress = useAccountAddress();
  const gasSettings = useGasSettings(STAKING_CHAIN_ID, GasSpeed.FAST);
  const { sponsored_rnbw_unstaking_enabled: sponsoredRnbwUnstakingEnabled } = useRemoteConfig('sponsored_rnbw_unstaking_enabled');
  const [isProcessing, setIsProcessing] = useState(false);
  const canUseSponsoredUnstake =
    Boolean(accountAddress) &&
    sponsoredRnbwUnstakingEnabled &&
    predictSponsoredCallsExecution({ address: accountAddress, chainId: STAKING_CHAIN_ID });
  const liveDisplay = {
    tokenAmount,
    nativeCurrencyAmount,
    netPnl,
    isPositivePnl,
    rnbwAfterUnstake,
    exitFeePercentage,
  };
  const frozenDisplayRef = useRef<typeof liveDisplay | null>(null);

  // Keep values live until submit, then freeze to prevent a brief zero value flash during sheet dismissal.
  const displayValues = isProcessing && frozenDisplayRef.current ? frozenDisplayRef.current : liveDisplay;

  const startUnstake = async () => {
    if (!gasSettings) {
      Alert.alert(
        i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstake_failed_title),
        i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstake_failed_message)
      );
      logger.error(new RainbowError('[RnbwUnstakeSheet]: Unstake failed, gas data unavailable'));
      return;
    }

    frozenDisplayRef.current = liveDisplay;
    setIsProcessing(true);
    try {
      const preparedCalls = canUseSponsoredUnstake
        ? unstakePreparationStore
            .getState()
            .getPreparedCalls({ accountAddress })
            .catch(() => null)
        : Promise.resolve(null);
      const { waitForConfirmation } = await unstakeRnbw({ address: accountAddress, gasParams: buildGasParams(gasSettings), preparedCalls });
      goBack();
      void waitForConfirmation().catch(error => {
        logger.warn('[RnbwUnstakeSheet]: Unstake confirmation failed', { error });
      });
    } catch (e) {
      setIsProcessing(false);
      frozenDisplayRef.current = null;
      Alert.alert(
        i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstake_failed_title),
        i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstake_failed_message)
      );
      const error = ensureError(e);
      logger.error(new RainbowError('[RnbwUnstakeSheet]: Unstake failed', error));
    }
  };

  return (
    <View style={styles.unstakeContentContainer}>
      <Stack space="44px">
        <Text color="label" size="20pt" weight="heavy" align="center">
          {i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstake_title, { symbol: RNBW_SYMBOL })}
        </Text>
        <Stack space="24px" alignHorizontal="center">
          <RnbwCoinIcon size={80} />
          <Stack space="12px" alignHorizontal="center">
            <Text color="label" size="44pt" weight="heavy" align="center">
              {displayValues.tokenAmount}
            </Text>
            <Text color="labelTertiary" size="17pt" weight="bold" align="center">
              {displayValues.nativeCurrencyAmount}
            </Text>
          </Stack>
        </Stack>
      </Stack>
      <Box paddingHorizontal="16px" marginTop={{ custom: 48 }}>
        <Separator color="separatorTertiary" thickness={1} />
        <Stack separator={<Separator color="separatorTertiary" thickness={1} />}>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {i18n.t(i18n.l.rnbw_staking.unstake_sheet.exit_fee)}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${displayValues.exitFeePercentage}%`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {i18n.t(i18n.l.rnbw_staking.unstake_sheet.receive)}
            </Text>
            <Text color="label" size="17pt" weight="bold">
              {`${displayValues.rnbwAfterUnstake} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
          <Box flexDirection="row" height={44} alignItems="center" justifyContent="space-between" width="full">
            <Text color="labelTertiary" size="17pt" weight="semibold">
              {i18n.t(i18n.l.rnbw_staking.unstake_sheet.total_return)}
            </Text>
            <Text color={displayValues.isPositivePnl ? 'green' : 'red'} size="17pt" weight="bold">
              {`${displayValues.netPnl} ${RNBW_SYMBOL}`}
            </Text>
          </Box>
        </Stack>
      </Box>
      <Box marginTop={{ custom: 32 }}>
        <RnbwHoldToActivateButton
          label={i18n.t(i18n.l.rnbw_staking.unstake_sheet.hold_to_unstake)}
          processingLabel={i18n.t(i18n.l.rnbw_staking.unstake_sheet.unstaking)}
          onActivate={startUnstake}
          isProcessing={isProcessing}
          disabled={!gasSettings}
          showBiometryIcon
          style={styles.fullWidthButton}
        />
        {canUseSponsoredUnstake && (
          <SmartWalletActivationCallout address={accountAddress} chainId={STAKING_CHAIN_ID} style={styles.smartWalletActivationCallout} />
        )}
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
  smartWalletActivationCallout: {
    marginTop: 8,
    width: '100%',
  },
});
