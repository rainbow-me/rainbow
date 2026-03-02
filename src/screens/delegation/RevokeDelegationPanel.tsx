import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { Wallet } from '@ethersproject/wallet';
import { LinearGradient } from 'expo-linear-gradient';
import { EstimateGasExecutionError, IntrinsicGasTooLowError } from 'viem';
import { useNavigation } from '@/navigation';
import { Box, Text, globalColors, Separator } from '@/design-system';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { type RootStackParamList } from '@/navigation/types';
import type Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import haptics from '@/utils/haptics';
import { executeRevokeDelegation } from '@rainbow-me/delegation';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import reduxStore from '@/redux/store';
import * as i18n from '@/languages';
import useGas from '@/hooks/useGas';
import { type GasFee, type LegacySelectedGasFee, type SelectedGasFee } from '@/entities/gas';
import { opacity } from '@/framework/ui/utils/opacity';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';

/**
 * Reasons for revoking delegation - determines the panel's appearance and messaging
 */
export enum RevokeReason {
  // User-triggered
  /** Toggle off Smart Wallet — revokes all chains */
  DISABLE_SMART_WALLET = 'disable_smart_wallet',
  /** Disable a single Rainbow-delegated chain */
  DISABLE_SINGLE_NETWORK = 'disable_single_network',
  /** Disable a third-party delegated chain */
  DISABLE_THIRD_PARTY = 'disable_third_party',
  // Backend-triggered (from shouldRevokeDelegation())
  /** Contract has a known exploit */
  ALERT_VULNERABILITY = 'alert_vulnerability',
  /** Contract has a known bug */
  ALERT_BUG = 'alert_bug',
  /** Unrecognized revoke reason from backend */
  ALERT_UNRECOGNIZED = 'alert_unrecognized',
  /** Catch-all for unspecified backend revoke signals */
  ALERT_UNSPECIFIED = 'alert_unspecified',
}

export type RevokeStatus =
  | 'notReady' // preparing the data necessary to revoke
  | 'ready' // ready to revoke state
  | 'revoking' // user has pressed the revoke button
  | 'pending' // revoke has been submitted but we don't have a tx hash
  | 'success' // revoke has been submitted and we have a tx hash
  | 'recoverableError' // revoke or auth has failed, can try again
  | 'unrecoverableError'; // revoke has failed, unrecoverable error

type SheetContent = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  accentColor: string;
};

type DelegationToRevoke = RootStackParamList[typeof Routes.REVOKE_DELEGATION_PANEL]['delegationsToRevoke'][number];
type RevokeGasOptions = NonNullable<ReturnType<typeof getRevokeTransactionGasOptions>>;

const REVOKE_SUCCESS_DELAY_MS = 2000;
const REVOKE_ESTIMATE_FALLBACK_GAS_LIMIT = 96_000n;
const REVOKE_GAS_WAIT_TIMEOUT_MS = 15_000;

const DEFAULT_LOCK_GRADIENT_COLORS: [string, string] = ['#3b7fff', '#b724ad'];
const DEFAULT_LOCK_GRADIENT_LOCATIONS: [number, number] = [0, 1];
const DEFAULT_LOCK_ACCENT_COLOR = DEFAULT_LOCK_GRADIENT_COLORS[1];

function isIntrinsicEstimateGasFailure(error: unknown): boolean {
  if (!(error instanceof EstimateGasExecutionError)) return false;
  return error.walk(cause => cause instanceof IntrinsicGasTooLowError) !== null;
}

const getSheetContent = (reason: RevokeReason, chainName?: string): SheetContent => {
  switch (reason) {
    // User-triggered
    case RevokeReason.DISABLE_SMART_WALLET:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_button),
        accentColor: DEFAULT_LOCK_ACCENT_COLOR,
      };
    case RevokeReason.DISABLE_SINGLE_NETWORK:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_title, { network: chainName || '' }),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_button),
        accentColor: DEFAULT_LOCK_ACCENT_COLOR,
      };
    case RevokeReason.DISABLE_THIRD_PARTY:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_button),
        accentColor: DEFAULT_LOCK_ACCENT_COLOR,
      };
    // Backend-triggered
    case RevokeReason.ALERT_VULNERABILITY:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_vulnerability_button),
        accentColor: globalColors.red60,
      };
    case RevokeReason.ALERT_BUG:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_bug_button),
        accentColor: globalColors.red60,
      };
    case RevokeReason.ALERT_UNRECOGNIZED:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unrecognized_button),
        accentColor: DEFAULT_LOCK_ACCENT_COLOR,
      };
    case RevokeReason.ALERT_UNSPECIFIED:
    default:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_button),
        accentColor: DEFAULT_LOCK_ACCENT_COLOR,
      };
  }
};

function getRevokeTransactionGasOptions(selectedGasFee: SelectedGasFee | LegacySelectedGasFee | undefined) {
  const gasFeeParams = selectedGasFee?.gasFeeParams;
  if (!gasFeeParams || !('maxBaseFee' in gasFeeParams)) return null;

  const maxPriorityFeePerGas = BigInt(gasFeeParams.maxPriorityFeePerGas.amount);
  return {
    gasLimit: null,
    maxFeePerGas: BigInt(gasFeeParams.maxBaseFee.amount) + maxPriorityFeePerGas,
    maxPriorityFeePerGas,
  };
}

async function waitForRevokeGasOptions({
  chainId,
  startPollingGasFees,
}: {
  chainId: number;
  startPollingGasFees: (chainId: number) => unknown;
}): Promise<RevokeGasOptions> {
  const initialGasState = reduxStore.getState().gas;
  const initialChainId = initialGasState.chainId;
  const initialSelectedGasFee = initialGasState.selectedGasFee;

  const getReadyOptions = () => {
    const gasState = reduxStore.getState().gas;
    if (gasState.chainId !== chainId) return null;

    const options = getRevokeTransactionGasOptions(gasState.selectedGasFee);
    if (!options) return null;

    const chainChanged = initialChainId !== chainId;
    const hasFreshSelectedGasFee = gasState.selectedGasFee !== initialSelectedGasFee;
    if (chainChanged && !hasFreshSelectedGasFee) return null;

    return options;
  };

  startPollingGasFees(chainId);

  const immediateOptions = getReadyOptions();
  if (immediateOptions) return immediateOptions;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error('Timed out waiting for revoke gas options'));
    }, REVOKE_GAS_WAIT_TIMEOUT_MS);

    const unsubscribe = reduxStore.subscribe(() => {
      const options = getReadyOptions();
      if (!options) return;

      clearTimeout(timeout);
      unsubscribe();
      resolve(options);
    });
  });
}

function replacePendingDelegations(
  pendingDelegationsRef: React.MutableRefObject<DelegationToRevoke[]>,
  nextDelegations: DelegationToRevoke[]
) {
  pendingDelegationsRef.current.length = 0;
  pendingDelegationsRef.current.push(...nextDelegations);
}

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const { params: { address, delegationsToRevoke = [], onSuccess, revokeReason = RevokeReason.ALERT_UNSPECIFIED } = {} } =
    useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('ready');
  const pendingDelegationsRef = useRef<DelegationToRevoke[]>(delegationsToRevoke);

  const currentDelegation = pendingDelegationsRef.current[0];
  const chainId = currentDelegation?.chainId;

  // Get chain name for display
  const chainName = chainId ? backendNetworksActions.getChainsLabel()[chainId] || `Chain ${chainId}` : '';

  // Gas management
  const { startPollingGasFees, stopPollingGasFees, selectedGasFee } = useGas();
  const nativeCurrency = userAssetsStoreManager(state => state.currency);

  useEffect(() => {
    if (chainId) {
      startPollingGasFees(chainId);
    }
    return () => {
      stopPollingGasFees();
    };
  }, [chainId, startPollingGasFees, stopPollingGasFees]);

  // Get gas fee display with $0.01 floor
  const gasFeeDisplay = (() => {
    if (!chainId || revokeStatus === 'revoking') return null;

    const gasFee: GasFee | undefined = selectedGasFee?.gasFee;
    if (!gasFee) return i18n.t(i18n.l.swap.loading);

    const amount = Number(gasFee.estimatedFee?.native?.value?.amount);
    if (!Number.isFinite(amount)) return i18n.t(i18n.l.swap.loading);
    return convertAmountToNativeDisplayWorklet(amount, nativeCurrency, true);
  })();

  // Get sheet content based on revoke reason
  const sheetContent = getSheetContent(revokeReason, chainName);

  const handleRevoke = useCallback(async () => {
    const pendingDelegations = pendingDelegationsRef.current;
    if (!address || pendingDelegations.length === 0) {
      goBack();
      return;
    }

    setRevokeStatus('revoking');

    try {
      const provider = getProvider({ chainId: pendingDelegations[0].chainId });
      const wallet = await loadWallet({
        address,
        provider,
      });

      if (!wallet) throw new Error('Failed to load wallet');
      if (!(wallet instanceof Wallet)) {
        throw new Error('Revoke delegation requires a software wallet signer');
      }

      const failedDelegations: DelegationToRevoke[] = [];
      for (const delegation of pendingDelegations) {
        try {
          const revokeProvider = getProvider({ chainId: delegation.chainId });
          const revokeSigner = wallet.connect(revokeProvider);

          const transactionGasOptions = await waitForRevokeGasOptions({
            chainId: delegation.chainId,
            startPollingGasFees,
          });
          const nonce = await getNextNonce({ address, chainId: delegation.chainId });

          let result;
          try {
            result = await executeRevokeDelegation({
              signer: revokeSigner,
              provider: revokeProvider,
              chainId: delegation.chainId,
              transactionOptions: transactionGasOptions,
              nonce,
            });
          } catch (error) {
            if (!isIntrinsicEstimateGasFailure(error)) throw error;

            logger.warn('Revoke gas estimate failed, retrying with fallback gas limit', {
              chainId: delegation.chainId,
              gasLimit: REVOKE_ESTIMATE_FALLBACK_GAS_LIMIT.toString(),
            });

            result = await executeRevokeDelegation({
              signer: revokeSigner,
              provider: revokeProvider,
              chainId: delegation.chainId,
              transactionOptions: {
                ...transactionGasOptions,
                gasLimit: REVOKE_ESTIMATE_FALLBACK_GAS_LIMIT,
              },
              nonce,
            });
          }

          logger.info('Delegation removed successfully', {
            hash: result.hash,
            chainId: delegation.chainId,
          });
        } catch (error) {
          failedDelegations.push(delegation);
          logger.error(new RainbowError('Failed to revoke delegation'), {
            error,
            chainId: delegation.chainId,
          });
        }
      }

      if (failedDelegations.length > 0) {
        replacePendingDelegations(pendingDelegationsRef, failedDelegations);
        haptics.notificationError();
        setRevokeStatus('recoverableError');
        return;
      }

      haptics.notificationSuccess();
      setRevokeStatus('success');

      setTimeout(() => {
        onSuccess?.();
        goBack();
      }, REVOKE_SUCCESS_DELAY_MS);
    } catch (error) {
      logger.error(new RainbowError('Failed to revoke delegation'), {
        error,
        chainId: pendingDelegations[0]?.chainId,
      });

      haptics.notificationError();
      setRevokeStatus('recoverableError');
    }
  }, [address, goBack, onSuccess, startPollingGasFees]);

  const buttonLabel = (() => {
    switch (revokeStatus) {
      case 'ready':
        return sheetContent.buttonLabel;
      case 'revoking':
        return i18n.t(i18n.l.wallet.delegations.revoke_panel.revoking);
      case 'success':
        return i18n.t(i18n.l.wallet.delegations.revoke_panel.done);
      case 'recoverableError':
        return i18n.t(i18n.l.wallet.delegations.revoke_panel.try_again);
      default:
        return sheetContent.buttonLabel;
    }
  })();

  const handleButtonPress = useCallback(() => {
    if (revokeStatus === 'ready' || revokeStatus === 'recoverableError') {
      handleRevoke();
    } else {
      goBack();
    }
  }, [goBack, handleRevoke, revokeStatus]);

  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'revoking';
  const isError = revokeStatus === 'recoverableError';
  const isSuccess = revokeStatus === 'success';
  const isCriticalBackendAlert = revokeReason === RevokeReason.ALERT_VULNERABILITY || revokeReason === RevokeReason.ALERT_BUG;
  const buttonBackgroundColor = isSuccess ? globalColors.green60 : isError ? globalColors.red60 : sheetContent.accentColor;
  const useDefaultButtonGradient = !isSuccess && !isError && !isCriticalBackendAlert;

  const iconGradientColors: [string, string, ...string[]] =
    isError || isCriticalBackendAlert
      ? [globalColors.red60, globalColors.red80, '#19002d']
      : isSuccess
        ? [globalColors.green60, globalColors.green80, '#19002d']
        : DEFAULT_LOCK_GRADIENT_COLORS;

  return (
    <PanelSheet showHandle showTapToDismiss>
      {/* Header with Smart Wallet Icon */}
      <Box alignItems="center" paddingTop="44px" paddingHorizontal="20px">
        {/* Smart Wallet Lock Icon with Gradient */}
        <Box
          width={{ custom: 52 }}
          height={{ custom: 52 }}
          borderRadius={16}
          borderWidth={1.926}
          borderColor={{ custom: 'rgba(255, 255, 255, 0.1)' }}
          style={styles.iconContainer}
        >
          <LinearGradient
            colors={iconGradientColors}
            locations={DEFAULT_LOCK_GRADIENT_LOCATIONS}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Box alignItems="center" justifyContent="center" width="full" height="full">
            <Text color="white" size="20pt" weight="heavy" align="center" style={styles.iconText}>
              {isSuccess ? '􀆅' : isError ? '􀇿' : '􀎡'}
            </Text>
          </Box>
        </Box>

        {/* Title */}
        <Box paddingTop="24px" alignItems="center">
          <Text size="26pt" weight="heavy" color="label" align="center">
            {sheetContent.title}
          </Text>
        </Box>

        {/* Subtitle */}
        <Box paddingTop="24px" width={{ custom: 295 }}>
          <Text size="17pt" weight="semibold" color="labelSecondary" align="center">
            {sheetContent.subtitle}
          </Text>
        </Box>
      </Box>

      {/* Separator */}
      <Box paddingTop="24px" paddingHorizontal="20px">
        <Separator color="separatorTertiary" />
      </Box>

      {/* Action Button */}
      <Box paddingTop="24px" paddingHorizontal="20px">
        <Box style={styles.buttonFrame}>
          {useDefaultButtonGradient && (
            <LinearGradient
              colors={DEFAULT_LOCK_GRADIENT_COLORS}
              locations={DEFAULT_LOCK_GRADIENT_LOCATIONS}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              pointerEvents="none"
              style={styles.buttonGradient}
            />
          )}
          <HoldToActivateButton
            backgroundColor={useDefaultButtonGradient ? 'transparent' : buttonBackgroundColor}
            disabledBackgroundColor={opacity(buttonBackgroundColor, 0.2)}
            disabled={isProcessing}
            isProcessing={isProcessing}
            label={buttonLabel}
            onLongPress={handleButtonPress}
            height={48}
            color={{ custom: globalColors.white100 }}
            showBiometryIcon={isReady}
            testID="revoke-delegation-button"
            processingLabel={buttonLabel}
            borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
            borderWidth={1}
          />
        </Box>
      </Box>

      {/* Gas Fee Preview */}
      <Box paddingTop="24px" paddingBottom="24px" alignItems="center" justifyContent="center">
        <Box flexDirection="row" alignItems="center" gap={4}>
          <Text size="13pt" weight="heavy" color="labelTertiary" align="center">
            􀵟
          </Text>
          <Text size="13pt" weight="bold" color="labelTertiary" align="center">
            {gasFeeDisplay ? (
              <>
                <Text size="13pt" weight="bold" color="labelTertiary">
                  {gasFeeDisplay}
                </Text>
                <Text size="13pt" weight="semibold" color="labelQuaternary">
                  {` ${i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee, { chainName })}`}
                </Text>
              </>
            ) : (
              i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee, { chainName })
            )}
          </Text>
        </Box>
      </Box>
    </PanelSheet>
  );
};

const styles = StyleSheet.create({
  buttonFrame: {
    height: 48,
    justifyContent: 'center',
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 48,
    borderRadius: 48,
  },
  iconContainer: {
    overflow: 'hidden',
  },
  iconText: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2.167 },
    textShadowRadius: 5.778,
  },
});
