import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Box, Text, globalColors, Separator } from '@/design-system';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import * as i18n from '@/languages';
import { opacity } from '@/framework/ui/utils/opacity';
import { useRevokeDelegationContext } from '../context/RevokeDelegationContext';
import { RevokeGasPreview } from './RevokeGasPreview';

const LOCK_GRADIENT_COLORS = ['#3b7fff', '#b724ad'];
const LOCK_GRADIENT_LOCATIONS = [0, 1];

export function RevokeDelegationFlow() {
  const { revokeStatus, sheetContent, isLastDelegation, isCriticalBackendAlert, revoke, dismiss } = useRevokeDelegationContext();

  const isNotReady = revokeStatus === 'notReady';
  const isReady = revokeStatus === 'ready';
  const isProcessing = revokeStatus === 'revoking';
  const isError = revokeStatus === 'recoverableError';
  const isUnrecoverableError = revokeStatus === 'unrecoverableError';
  const isSuccess = revokeStatus === 'success';

  const buttonBackgroundColor = isSuccess ? globalColors.green60 : isError ? globalColors.red60 : sheetContent.accentColor;
  const useDefaultButtonGradient = !isSuccess && !isError && !isUnrecoverableError && !isCriticalBackendAlert;

  const buttonLabel = (() => {
    if (isNotReady || isReady) return sheetContent.buttonLabel;
    if (isProcessing) return i18n.t(i18n.l.wallet.delegations.revoke_panel.revoking);
    if (isSuccess)
      return isLastDelegation ? i18n.t(i18n.l.wallet.delegations.revoke_panel.done) : i18n.t(i18n.l.wallet.delegations.revoke_panel.next);
    if (isError) return i18n.t(i18n.l.wallet.delegations.revoke_panel.try_again);
    if (isUnrecoverableError) return i18n.t(i18n.l.wallet.delegations.revoke_panel.done);
    return sheetContent.buttonLabel;
  })();

  const disabled = isProcessing || isNotReady;

  const handleButtonPress = useCallback(() => {
    if (isReady || isError) {
      revoke();
    } else if (isUnrecoverableError) {
      dismiss();
    } else {
      dismiss();
    }
  }, [isReady, isError, isUnrecoverableError, revoke, dismiss]);

  return (
    <PanelSheet showHandle showTapToDismiss>
      {/* Header with Smart Wallet Icon */}
      <Box alignItems="center" paddingTop="44px" paddingHorizontal="20px">
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
                    : LOCK_GRADIENT_COLORS
            }
            locations={LOCK_GRADIENT_LOCATIONS}
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

        <Box paddingTop="24px" alignItems="center">
          <Text size="26pt" weight="heavy" color="label" align="center">
            {sheetContent.title}
          </Text>
        </Box>

        <Box paddingTop="24px" width={{ custom: 295 }}>
          <Text size="17pt" weight="semibold" color="labelSecondary" align="center">
            {sheetContent.subtitle}
          </Text>
        </Box>
      </Box>

      <Box paddingTop="24px" paddingHorizontal="20px">
        <Separator color="separatorTertiary" />
      </Box>

      {/* Action Button */}
      <Box paddingTop="24px" paddingHorizontal="20px">
        <Box style={styles.buttonFrame}>
          {useDefaultButtonGradient && (
            <LinearGradient
              colors={[...LOCK_GRADIENT_COLORS]}
              locations={[...LOCK_GRADIENT_LOCATIONS]}
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
            disabled={disabled}
            isProcessing={isProcessing}
            label={buttonLabel}
            onLongPress={handleButtonPress}
            height={48}
            color={{ custom: globalColors.white100 }}
            showBiometryIcon={isNotReady || isReady}
            testID="revoke-delegation-button"
            processingLabel={buttonLabel}
            borderColor={{ custom: 'rgba(255, 255, 255, 0.08)' }}
            borderWidth={1}
          />
        </Box>
      </Box>

      <RevokeGasPreview />
    </PanelSheet>
  );
}

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
