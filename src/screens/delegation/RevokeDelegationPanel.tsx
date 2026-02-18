import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Wallet } from '@ethersproject/wallet';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@/navigation';
import { Box, Text, globalColors, Separator } from '@/design-system';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import haptics from '@/utils/haptics';
import { executeRevokeDelegation } from '@rainbow-me/delegation';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import { ChainId } from '@/state/backendNetworks/types';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import * as i18n from '@/languages';
import useGas from '@/hooks/useGas';
import { GasFee, LegacyGasFee } from '@/entities/gas';
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

const REVOKE_SUCCESS_DELAY_MS = 2000;

const DEFAULT_LOCK_GRADIENT_COLORS = ['#3b7fff', '#b724ad'];
const DEFAULT_LOCK_GRADIENT_LOCATIONS = [0, 1];
const DEFAULT_LOCK_ACCENT_COLOR = DEFAULT_LOCK_GRADIENT_COLORS[1];

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

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const { params: { address, delegationsToRevoke = [], onSuccess, revokeReason = RevokeReason.ALERT_UNSPECIFIED } = {} } =
    useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('ready');

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;
  const chainId = currentDelegation?.chainId as ChainId;

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
    if (!chainId) return null;
    const gasFee = selectedGasFee?.gasFee;
    if (!gasFee) return i18n.t(i18n.l.swap.loading);
    const isLegacy = !!(gasFee as LegacyGasFee)?.estimatedFee;
    const feeData = isLegacy ? (gasFee as LegacyGasFee)?.estimatedFee : (gasFee as GasFee)?.maxFee;
    const amount = Number(feeData?.native?.value?.amount);
    if (!Number.isFinite(amount)) return i18n.t(i18n.l.swap.loading);
    return convertAmountToNativeDisplayWorklet(amount, nativeCurrency, true);
  })();

  // Get sheet content based on revoke reason
  const sheetContent = getSheetContent(revokeReason, chainName);

  const handleRevoke = useCallback(async () => {
    if (!currentDelegation || !address) {
      goBack();
      return;
    }

    setRevokeStatus('revoking');

    try {
      const provider = getProvider({ chainId: currentDelegation.chainId });

      const wallet = await loadWallet({
        address,
        provider,
      });

      if (!wallet) {
        throw new Error('Failed to load wallet');
      }

      // Get current gas prices from provider
      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt() ?? 0n;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt() ?? 0n;

      const nonce = await getNextNonce({ address, chainId: currentDelegation.chainId });

      const result = await executeRevokeDelegation({
        signer: wallet as Wallet,
        provider,
        chainId: currentDelegation.chainId,
        transactionOptions: {
          maxFeePerGas,
          maxPriorityFeePerGas,
          gasLimit: null,
        },
        nonce,
      });

      logger.info('Delegation removed successfully', {
        hash: result.hash,
        chainId: currentDelegation.chainId,
      });

      haptics.notificationSuccess();
      setRevokeStatus('success');

      // Move to next delegation or finish
      setTimeout(() => {
        if (isLastDelegation) {
          onSuccess?.();
          goBack();
        } else {
          setCurrentIndex(prev => prev + 1);
          setRevokeStatus('ready');
        }
      }, REVOKE_SUCCESS_DELAY_MS);
    } catch (error) {
      logger.error(new RainbowError('Failed to revoke delegation'), {
        error,
        chainId: currentDelegation.chainId,
      });
      haptics.notificationError();
      setRevokeStatus('recoverableError');
    }
  }, [address, currentDelegation, isLastDelegation, goBack, onSuccess]);

  const buttonLabel = (() => {
    switch (revokeStatus) {
      case 'ready':
        return sheetContent.buttonLabel;
      case 'revoking':
        return i18n.t(i18n.l.wallet.delegations.revoke_panel.revoking);
      case 'success':
        return isLastDelegation ? i18n.t(i18n.l.wallet.delegations.revoke_panel.done) : i18n.t(i18n.l.wallet.delegations.revoke_panel.next);
      case 'recoverableError':
        return i18n.t(i18n.l.wallet.delegations.revoke_panel.try_again);
      default:
        return sheetContent.buttonLabel;
    }
  })();

  const handleButtonPress = useCallback(() => {
    if (revokeStatus === 'ready' || revokeStatus === 'recoverableError') {
      handleRevoke();
    } else if (revokeStatus === 'success' && !isLastDelegation) {
      setCurrentIndex(prev => prev + 1);
      setRevokeStatus('ready');
    } else {
      goBack();
    }
  }, [revokeStatus, handleRevoke, isLastDelegation, goBack]);

  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'revoking';
  const isError = revokeStatus === 'recoverableError';
  const isSuccess = revokeStatus === 'success';
  const isCriticalBackendAlert = revokeReason === RevokeReason.ALERT_VULNERABILITY || revokeReason === RevokeReason.ALERT_BUG;
  const buttonBackgroundColor = isSuccess ? globalColors.green60 : isError ? globalColors.red60 : sheetContent.accentColor;
  const useDefaultButtonGradient = !isSuccess && !isError && !isCriticalBackendAlert;

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
            colors={
              isError
                ? [globalColors.red60, globalColors.red80, '#19002d']
                : isSuccess
                  ? [globalColors.green60, globalColors.green80, '#19002d']
                  : isCriticalBackendAlert
                    ? [globalColors.red60, globalColors.red80, '#19002d']
                    : DEFAULT_LOCK_GRADIENT_COLORS
            }
            locations={DEFAULT_LOCK_GRADIENT_LOCATIONS}
            useAngle
            angle={132.532}
            angleCenter={{ x: 0.5, y: 0.5 }}
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
              colors={[...DEFAULT_LOCK_GRADIENT_COLORS]}
              locations={[...DEFAULT_LOCK_GRADIENT_LOCATIONS]}
              useAngle
              angle={132.532}
              angleCenter={{ x: 0.5, y: 0.5 }}
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
