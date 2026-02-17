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
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import * as i18n from '@/languages';
import useGas from '@/hooks/useGas';
import { GasFee, LegacyGasFee } from '@/entities/gas';

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
    // User-triggered
    case RevokeReason.DISABLE_SMART_WALLET:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_smart_wallet_button),
        accentColor: globalColors.blue60,
      };
    case RevokeReason.DISABLE_SINGLE_NETWORK:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_title, { network: chainName || '' }),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_single_network_button),
        accentColor: globalColors.blue60,
      };
    case RevokeReason.DISABLE_THIRD_PARTY:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.disable_third_party_button),
        accentColor: globalColors.orange60,
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
        accentColor: globalColors.red60,
      };
    case RevokeReason.ALERT_UNSPECIFIED:
    default:
      return {
        title: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_title),
        subtitle: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_subtitle),
        buttonLabel: i18n.t(i18n.l.wallet.delegations.revoke_panel.alert_unspecified_button),
        accentColor: globalColors.red60,
      };
  }
};

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const {
    params: { delegationsToRevoke, onSuccess, revokeReason = RevokeReason.ALERT_UNSPECIFIED },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [revokeStatus, setRevokeStatus] = useState<RevokeStatus>('ready');
  const accountAddress = useWalletsStore(state => state.accountAddress);
  const getChainsLabel = useBackendNetworksStore(state => state.getChainsLabel);

  const currentDelegation = delegationsToRevoke[currentIndex];
  const isLastDelegation = currentIndex === delegationsToRevoke.length - 1;
  const chainId = currentDelegation?.chainId as ChainId;

  // Get chain name for display
  const chainsLabel = getChainsLabel();
  const chainName = chainId ? chainsLabel[chainId] || `Chain ${chainId}` : '';

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
    if (!currentDelegation || !accountAddress) {
      goBack();
      return;
    }

    setRevokeStatus('claiming');

    try {
      const provider = getProvider({ chainId: currentDelegation.chainId });

      const wallet = await loadWallet({
        address: accountAddress,
        provider,
      });

      if (!wallet) {
        throw new Error('Failed to load wallet');
      }

      // Get current gas prices from provider
      const feeData = await provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas?.toBigInt() ?? 0n;
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt() ?? 0n;

      const nonce = await getNextNonce({ address: accountAddress, chainId: currentDelegation.chainId });

      const result = await executeRevokeDelegation({
        signer: wallet as Wallet,
        address: accountAddress,
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
        contractAddress: currentDelegation.contractAddress,
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
        contractAddress: currentDelegation.contractAddress,
      });
      haptics.notificationError();
      setRevokeStatus('recoverableError');
    }
  }, [currentDelegation, accountAddress, isLastDelegation, goBack, onSuccess]);

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

  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'claiming';
  const isError = revokeStatus === 'recoverableError';
  const isSuccess = revokeStatus === 'success';
  const isConflict = revokeReason === RevokeReason.DISABLE_THIRD_PARTY;
  const isBackendAlert = (revokeReason as string).startsWith('alert_');

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
                  : isBackendAlert
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
  iconContainer: {
    overflow: 'hidden',
  },
  iconText: {
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2.167 },
    textShadowRadius: 5.778,
  },
});
