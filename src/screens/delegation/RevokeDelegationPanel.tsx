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
import { GasFee, LegacyGasFee } from '@/entities';

/**
 * Reasons for revoking delegation - determines the panel's appearance and messaging
 */
export enum RevokeReason {
  /** User manually chose to disable Smart Wallet for all chains */
  DISABLE_SMART_WALLET = 'disable_smart_wallet',
  /** User manually chose to revoke a single network delegation */
  REVOKE_SINGLE_NETWORK = 'revoke_single_network',
  /** Third-party Smart Wallet provider detected - user can switch to Rainbow */
  THIRD_PARTY_CONFLICT = 'third_party_conflict',
  /** Security concern - unknown delegation detected */
  SECURITY_ALERT = 'security_alert',
  /** User-initiated revoke from settings */
  SETTINGS_REVOKE = 'settings_revoke',
}

export type RevokeStatus =
  | 'notReady' // preparing the data necessary to revoke
  | 'ready' // ready to revoke state
  | 'claiming' // user has pressed the revoke button
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

const getSheetContent = (reason: RevokeReason, chainName?: string): SheetContent => {
  switch (reason) {
    case RevokeReason.DISABLE_SMART_WALLET:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_button),
        accentColor: globalColors.blue60,
      };
    case RevokeReason.REVOKE_SINGLE_NETWORK:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.revoke_network_title, { network: chainName || '' }),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.revoke_network_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.revoke_network_button),
        accentColor: globalColors.blue60,
      };
    case RevokeReason.THIRD_PARTY_CONFLICT:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.conflict_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.conflict_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.conflict_button),
        accentColor: globalColors.orange60,
      };
    case RevokeReason.SECURITY_ALERT:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.security_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.security_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.security_button),
        accentColor: globalColors.red60,
      };
    case RevokeReason.SETTINGS_REVOKE:
    default:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.settings_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.settings_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.settings_button),
        accentColor: globalColors.blue60,
      };
  }
};

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const {
    params: { address, delegationsToRevoke, onSuccess, revokeReason = RevokeReason.SETTINGS_REVOKE },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('ready');

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;
  const chainId = currentDelegation?.chainId as ChainId;

  // Get chain name for display
  const chainName = backendNetworksActions.getChainsLabel()[chainId] || `Chain ${chainId}`;

  // Gas management
  const { startPollingGasFees, stopPollingGasFees, selectedGasFee } = useGas();

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
    const gasFee = selectedGasFee?.gasFee;
    if (!gasFee) return null;
    const isLegacy = !!(gasFee as LegacyGasFee)?.estimatedFee;
    const feeData = isLegacy ? (gasFee as LegacyGasFee)?.estimatedFee : (gasFee as GasFee)?.maxFee;
    const amount = parseFloat(feeData?.native?.value?.amount || '0');
    // Round up to $0.01 for very small amounts
    if (amount > 0 && amount < 0.01) {
      return '$0.01';
    }
    return feeData?.native?.value?.display;
  })();

  // Get sheet content based on revoke reason
  const sheetContent = getSheetContent(revokeReason, chainName);

  const handleRevoke = useCallback(async () => {
    if (!currentDelegation) return;

    setRevokeStatus('claiming');

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
      }, 2000);
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
      case 'claiming':
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

  if (!currentDelegation) {
    return null;
  }

  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'claiming';
  const isError = revokeStatus === 'recoverableError';
  const isSuccess = revokeStatus === 'success';
  const isConflict = revokeReason === RevokeReason.THIRD_PARTY_CONFLICT;
  const isSecurityAlert = revokeReason === RevokeReason.SECURITY_ALERT;

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
                  : isSecurityAlert
                    ? [globalColors.red60, globalColors.red80, '#19002d']
                    : isConflict
                      ? [globalColors.orange60, globalColors.orange80, '#19002d']
                      : ['#3b7fff', '#b724ad', '#19002d']
            }
            locations={[0.043, 0.887, 1]}
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
        <HoldToActivateButton
          backgroundColor={isSuccess ? globalColors.green60 : isError ? globalColors.red60 : globalColors.blue60}
          disabledBackgroundColor={'rgba(38, 143, 255, 0.2)'}
          disabled={isProcessing}
          isProcessing={isProcessing}
          label={buttonLabel}
          onLongPress={handleButtonPress}
          height={48}
          showBiometryIcon={isReady}
          testID="revoke-delegation-button"
          processingLabel={buttonLabel}
          borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
          borderWidth={1}
        />
      </Box>

      {/* Gas Fee Preview */}
      <Box paddingTop="24px" paddingBottom="24px" alignItems="center" justifyContent="center">
        <Box flexDirection="row" alignItems="center" gap={4}>
          <Text size="13pt" weight="heavy" color={{ custom: 'rgba(245, 248, 255, 0.56)' }} align="center">
            􀵟
          </Text>
          <Text size="13pt" weight="bold" color={{ custom: 'rgba(245, 248, 255, 0.56)' }} align="center">
            {gasFeeDisplay ? (
              <>
                <Text size="13pt" weight="bold" color={{ custom: 'rgba(245, 248, 255, 0.56)' }}>
                  {gasFeeDisplay}
                </Text>
                <Text size="13pt" weight="semibold" color={{ custom: 'rgba(245, 248, 255, 0.4)' }}>
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
  iconContainer: {
    overflow: 'hidden',
  },
  iconText: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2.167 },
    textShadowRadius: 5.778,
  },
});
