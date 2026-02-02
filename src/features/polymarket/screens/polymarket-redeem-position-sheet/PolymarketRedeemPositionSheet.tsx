import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, globalColors, Text, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { logger, RainbowError } from '@/logger';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import LinearGradient from 'react-native-linear-gradient';
import { getColorValueForThemeWorklet } from '@/__swaps__/utils/swaps';
import { opacity } from '@/data/opacity';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import Navigation from '@/navigation/Navigation';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { redeemPosition } from '@/features/polymarket/utils/redeemPosition';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { BlurView } from 'react-native-blur-view';
import { checkIfReadOnlyWallet } from '@/state/wallets/walletsStore';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';

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
    if (checkIfReadOnlyWallet(usePolymarketClients.getState().address)) return;
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
    ? [opacity(accentColor, 0.22), opacity(accentColor, 0)]
    : [opacity(accentColor, 0), opacity(accentColor, 0.06)];

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
            {formatCurrency(String(position.currentValue))}
          </Text>
          <Text size="20pt" weight="bold" color={{ custom: pnlColor }}>
            {pnlSign}
            {formatCurrency(String(absPnl))}
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
