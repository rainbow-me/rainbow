import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'react-native-blur-view';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, globalColors, Text, useColorMode, useForegroundColor } from '@/design-system';
import { opacity } from '@/design-system/utils/opacity';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { polymarketBalanceActions } from '@/features/polymarket/stores/polymarketBalanceStore';
import { polymarketPositionsActions, usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { getPositionColors } from '@/features/polymarket/utils/getMarketColor';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import { redeemPosition } from '@/features/polymarket/utils/redeemPosition';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import type Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { checkIfReadOnlyWallet, getAccountAddress } from '@/state/wallets/walletsStore';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const PolymarketRedeemPositionSheet = memo(function PolymarketRedeemPositionSheet() {
  const {
    params: { position: initialPosition },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MANAGE_POSITION_SHEET>>();

  const position = usePolymarketPositionsStore(
    state => state.getPosition(initialPosition.asset, initialPosition.proxyWallet) ?? initialPosition
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const { isDarkMode } = useColorMode();
  const accentColor = getColorValueForThemeWorklet(getPositionColors(position), isDarkMode);
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const buttonBackgroundColor = getSolidColorEquivalent({
    background: opacity(accentColor, 0.7),
    foreground: '#000000',
    opacity: 0.4,
  });

  const isClaim = getPositionAction(position) === PositionAction.CLAIM;
  const actionButtonLabel = i18n.t(
    isClaim ? i18n.l.predictions.manage_position.hold_to_claim : i18n.l.predictions.manage_position.hold_to_clear
  );
  const actionButtonLoadingLabel = i18n.t(
    isClaim ? i18n.l.predictions.manage_position.claiming : i18n.l.predictions.manage_position.clearing
  );

  const handleRedeemPosition = useCallback(async () => {
    if (checkIfReadOnlyWallet(getAccountAddress())) return;
    setIsProcessing(true);
    const balanceBeforeRedemption = polymarketBalanceActions.getBalanceSnapshot(position.proxyWallet);
    let redemption: Awaited<ReturnType<typeof redeemPosition>>;

    try {
      redemption = await redeemPosition(position);
    } catch (e) {
      logger.error(new RainbowError('[PolymarketRedeemPositionSheet] Error redeeming position', e));
      setIsProcessing(false);
      Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_claim));
      return;
    }

    try {
      polymarketPositionsActions.applyExpectedPositionRemoval({ operationId: redemption.transactionId, position });
      if (isClaim && balanceBeforeRedemption) {
        polymarketBalanceActions.applyExpectedBalanceDelta({
          baseline: balanceBeforeRedemption,
          deltaUsd: String(position.currentValue),
          operationId: redemption.transactionId,
          proxyWallet: position.proxyWallet,
        });
      }
    } catch (e) {
      logger.error(new RainbowError('[PolymarketRedeemPositionSheet] Error publishing redeemed position', e));
    }
    void redemption.outcome
      .then(outcome => {
        if (outcome === 'failed') {
          polymarketPositionsActions.discardExpectedPosition({
            asset: position.asset,
            operationId: redemption.transactionId,
            proxyAddress: position.proxyWallet,
          });
          if (isClaim) {
            polymarketBalanceActions.discardExpectedBalanceDelta({
              operationId: redemption.transactionId,
              proxyWallet: position.proxyWallet,
            });
          }
        }

        const settlementRead =
          outcome === 'confirmed' && isClaim
            ? polymarketBalanceActions.finalizeExpectedBalanceDelta({
                operationId: redemption.transactionId,
                proxyWallet: position.proxyWallet,
              })
            : undefined;

        return refetchPolymarketStores(position.proxyWallet, settlementRead);
      })
      .catch(error => logger.error(new RainbowError('[PolymarketRedeemPositionSheet] Error refreshing redeemed position', error)));
    Navigation.goBack();
  }, [isClaim, position]);

  const pnl = position.cashPnl;
  const pnlColor = pnl >= 0 ? green : red;
  const pnlSign = pnl >= 0 ? '+' : '-';
  const absPnl = Math.abs(pnl);

  const gradientFillColors = isDarkMode
    ? ([opacity(accentColor, 0.22), opacity(accentColor, 0)] as const)
    : ([opacity(accentColor, 0), opacity(accentColor, 0.06)] as const);

  return (
    <PanelSheet innerBorderWidth={1} panelStyle={{ backgroundColor: isDarkMode ? globalColors.grey100 : POLYMARKET_BACKGROUND_LIGHT }}>
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={gradientFillColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        {!isDarkMode && <BlurView style={StyleSheet.absoluteFill} blurIntensity={42} />}
      </View>
      <Box paddingHorizontal="24px" paddingBottom={'24px'}>
        <Box alignItems="center" gap={18} paddingTop={{ custom: 71 }} paddingBottom={{ custom: 78 }}>
          <Text size="20pt" weight="heavy" color="labelTertiary">
            {i18n.t(i18n.l.predictions.manage_position.position_value)}
          </Text>
          <Text size="44pt" weight="heavy" color="label">
            {formatUsd(String(position.currentValue))}
          </Text>
          <Text size="20pt" weight="bold" color={{ custom: pnlColor }}>
            {pnlSign}
            {formatUsd(String(absPnl))}
          </Text>
        </Box>
        <Box gap={24}>
          <PolymarketPositionCard position={position} showActionButton={false} />
          <HoldToActivateButton
            backgroundColor={buttonBackgroundColor}
            borderColor={{ custom: opacity('#FFFFFF', 0.08) }}
            borderWidth={2}
            disabledBackgroundColor={'gray'}
            label={actionButtonLabel}
            processingLabel={actionButtonLoadingLabel}
            isProcessing={isProcessing}
            onLongPress={handleRedeemPosition}
            showBiometryIcon={false}
            height={48}
            color={'white'}
            progressColor={'white'}
          />
        </Box>
      </Box>
    </PanelSheet>
  );
});
