import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'react-native-blur-view';

import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, globalColors, Text, useColorMode, useForegroundColor } from '@/design-system';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import { redeemPosition } from '@/features/polymarket/utils/redeemPosition';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { opacity } from '@/framework/ui/utils/opacity';
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

  const position = usePolymarketPositionsStore(state => state.getPosition(initialPosition.asset) ?? initialPosition);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isDarkMode } = useColorMode();
  const accentColor = getColorValueForThemeWorklet(getPositionAccentColor(position), isDarkMode);
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const buttonBackgroundColor = getSolidColorEquivalent({
    background: opacity(accentColor, 0.7),
    foreground: '#000000',
    opacity: 0.4,
  });

  const actionButtonType = useMemo(() => getPositionAction(position), [position]);

  const actionButtonLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_claim);
      case PositionAction.CLEAR:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_clear);
      default:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_claim);
    }
  }, [actionButtonType]);

  const actionButtonLoadingLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return i18n.t(i18n.l.predictions.manage_position.claiming);
      case PositionAction.CLEAR:
        return i18n.t(i18n.l.predictions.manage_position.clearing);
      default:
        return i18n.t(i18n.l.predictions.manage_position.claiming);
    }
  }, [actionButtonType]);

  const [processingLabel, setProcessingLabel] = useState(actionButtonLoadingLabel);

  const handleClaimPosition = useCallback(async () => {
    if (checkIfReadOnlyWallet(getAccountAddress())) return;
    setIsProcessing(true);
    setProcessingLabel(actionButtonLoadingLabel);
    try {
      await redeemPosition(position);
      refetchPolymarketStores();
      Navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error claiming position', e));
      setIsProcessing(false);
      Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_claim));
    }
  }, [position, actionButtonLoadingLabel]);

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
            processingLabel={processingLabel}
            isProcessing={isProcessing}
            onLongPress={handleClaimPosition}
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
