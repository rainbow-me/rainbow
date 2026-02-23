import { useEffect, useCallback, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@/navigation';
import { type RootStackParamList } from '@/navigation/types';
import type Routes from '@/navigation/routesNames';
import { Box, Text, globalColors, Separator } from '@/design-system';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import * as i18n from '@/languages';
import { opacity } from '@/framework/ui/utils/opacity';
import { type ChainId } from '@/state/backendNetworks/types';
import { backendNetworksActions } from '@/state/backendNetworks/backendNetworks';
import { useRevokeDelegation } from './useRevokeDelegation';
import { useRevokeDelegationGasFee } from './useRevokeDelegationGas';
import { RevokeReason, type RevokeStatus } from './types';

type SheetContent = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  accentColor: string;
};

const REVOKE_SUCCESS_DELAY_MS = 2000;

const DEFAULT_LOCK_GRADIENT_COLORS = ['#3b7fff', '#b724ad'] as const;
const DEFAULT_LOCK_GRADIENT_LOCATIONS = [0, 1] as const;
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

const getButtonLabel = (revokeStatus: RevokeStatus, sheetContent: SheetContent): string => {
  switch (revokeStatus) {
    case 'ready':
    case 'notReady':
      return sheetContent.buttonLabel;
    case 'revoking':
      return i18n.t(i18n.l.wallet.delegations.revoke_panel.revoking);
    case 'success':
      return i18n.t(i18n.l.wallet.delegations.revoke_panel.done);
    case 'error':
      return i18n.t(i18n.l.wallet.delegations.revoke_panel.try_again);
    case 'insufficientGas':
      return i18n.t(i18n.l.wallet.delegations.revoke_panel.insufficient_gas);
    default:
      return sheetContent.buttonLabel;
  }
};

export const RevokeDelegationPanel = () => {
  const { goBack } = useNavigation();
  const { params: { address, delegationsToRevoke = [], onSuccess, revokeReason = RevokeReason.ALERT_UNSPECIFIED } = {} } =
    useRoute<RouteProp<RootStackParamList, typeof Routes.REVOKE_DELEGATION_PANEL>>();

  const delegationChainIdsKey = useMemo(
    () =>
      delegationsToRevoke
        .map(d => d.chainId)
        .sort((a, b) => a - b)
        .join(','),
    [delegationsToRevoke]
  );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableDelegationsToRevoke = useMemo(() => delegationsToRevoke, [delegationChainIdsKey]);

  const firstChainId = delegationsToRevoke[0]?.chainId as ChainId | undefined;
  const chainName = firstChainId ? backendNetworksActions.getChainsLabel()[firstChainId] || `Chain ${firstChainId}` : '';

  const { revokeStatus, handleRevoke, revokeCount } = useRevokeDelegation({
    address,
    delegationsToRevoke: stableDelegationsToRevoke,
    onSuccess,
  });
  const gasFeeDisplay = useRevokeDelegationGasFee(stableDelegationsToRevoke, address);

  // Auto-dismiss on success
  useEffect(() => {
    if (revokeStatus !== 'success') return;
    const timer = setTimeout(() => goBack(), REVOKE_SUCCESS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [revokeStatus, goBack]);

  const onButtonPress = useCallback(() => {
    if (revokeStatus === 'ready' || revokeStatus === 'error') {
      handleRevoke();
    } else {
      goBack();
    }
  }, [revokeStatus, handleRevoke, goBack]);

  const sheetContent = getSheetContent(revokeReason, chainName);
  const buttonLabel = getButtonLabel(revokeStatus, sheetContent);

  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'revoking';
  const isError = revokeStatus === 'error' || revokeStatus === 'insufficientGas';
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
              (isError
                ? [globalColors.red60, globalColors.red80, '#19002d']
                : isSuccess
                  ? [globalColors.green60, globalColors.green80, '#19002d']
                  : isCriticalBackendAlert
                    ? [globalColors.red60, globalColors.red80, '#19002d']
                    : DEFAULT_LOCK_GRADIENT_COLORS) as [string, string, ...string[]]
            }
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
            onLongPress={onButtonPress}
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
      {revokeCount > 0 ? (
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
                    {revokeCount === 1
                      ? ` ${i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee, { chainName })}`
                      : ` ${i18n.t(i18n.l.wallet.delegations.revoke_panel.gas_fee_multi, { count: revokeCount })}`}
                  </Text>
                </>
              ) : (
                i18n.t(i18n.l.wallet.delegations.revoke_panel.estimating_gas_fee)
              )}
            </Text>
          </Box>
        </Box>
      ) : (
        <Box paddingTop="24px" paddingBottom="24px" alignItems="center" justifyContent="center">
          <Text size="13pt" weight="bold" color="labelTertiary" align="center">
            {i18n.t(i18n.l.wallet.delegations.revoke_panel.simulated)}
          </Text>
        </Box>
      )}
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
