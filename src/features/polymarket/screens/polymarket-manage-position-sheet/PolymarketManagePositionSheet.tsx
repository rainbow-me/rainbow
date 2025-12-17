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
import { Side } from '@polymarket/clob-client';
import { ensureError, logger, RainbowError } from '@/logger';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import LinearGradient from 'react-native-linear-gradient';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { formatPrice } from '@/features/polymarket/utils/formatPrice';
import { divWorklet, mulWorklet, subWorklet } from '@/safe-math/SafeMath';
import { marketSellTotalPosition } from '@/features/polymarket/utils/orders';
import { collectTradeFee } from '@/features/polymarket/utils/collectTradeFee';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import Navigation from '@/navigation/Navigation';
import { refetchPolymarketStores, waitForPositionSizeUpdate } from '@/features/polymarket/utils/refetchPolymarketStores';
import { redeemPosition } from '@/features/polymarket/utils/redeemPosition';
import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { getPositionTokenId } from '@/features/polymarket/utils/getPositionTokenId';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { BlurView } from 'react-native-blur-view';
import { analytics } from '@/analytics';
import { USD_FEE_PER_TOKEN } from '@/features/polymarket/constants';

export const PolymarketManagePositionSheet = memo(function PolymarketManagePositionSheet() {
  const {
    params: { position: initialPosition },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MANAGE_POSITION_SHEET>>();

  const position = usePolymarketPositionsStore(state => state.getPosition(initialPosition.asset) ?? initialPosition);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isDarkMode } = useColorMode();
  const accentColor = getPositionAccentColor(position);
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');
  const buttonBackgroundColor = getSolidColorEquivalent({
    background: opacityWorklet(accentColor, 0.7),
    foreground: '#000000',
    opacity: 0.4,
  });

  const actionButtonType = useMemo(() => getPositionAction(position), [position]);

  const actionButtonLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_claim);
      case PositionAction.BURN:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_burn);
      case PositionAction.CASH_OUT:
        return i18n.t(i18n.l.predictions.manage_position.hold_to_cash_out);
    }
  }, [actionButtonType]);

  const actionButtonLoadingLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return i18n.t(i18n.l.predictions.manage_position.claiming);
      case PositionAction.BURN:
        return i18n.t(i18n.l.predictions.manage_position.burning);
      case PositionAction.CASH_OUT:
        return i18n.t(i18n.l.predictions.manage_position.cashing_out);
    }
  }, [actionButtonType]);

  const livePrice = useLiveTokenValue({
    tokenId: getPositionTokenId(position),
    initialValue: formatPrice(position.curPrice, position.market.orderPriceMinTickSize),
    selector: token => formatPrice(token.price, position.market.orderPriceMinTickSize),
  });

  const livePositionValue = useMemo(() => {
    return mulWorklet(position.size, livePrice);
  }, [position.size, livePrice]);

  const livePnl = useMemo(() => {
    return subWorklet(livePositionValue, position.initialValue);
  }, [livePositionValue, position.initialValue]);

  const handleCashOutPosition = useCallback(async () => {
    try {
      const price = await polymarketClobDataClient.calculateMarketPrice(position.asset, Side.SELL, position.size);
      const orderResult = await marketSellTotalPosition({ position, price });
      const tokensSold = orderResult.makingAmount;
      const usdReceived = orderResult.takingAmount;
      const fee = mulWorklet(tokensSold, USD_FEE_PER_TOKEN);

      analytics.track(analytics.event.predictionsPlaceOrder, {
        eventSlug: position.eventSlug,
        marketSlug: position.slug,
        outcome: position.outcome,
        orderAmountUsd: Number(usdReceived),
        feeAmountUsd: Number(fee),
        tokenAmount: Number(tokensSold),
        tokenId: position.asset,
        orderPriceUsd: Number(price),
        bestPriceUsd: Number(livePrice),
        averagePriceUsd: Number(divWorklet(usdReceived, tokensSold)),
        side: 'sell',
      });

      void collectTradeFee(tokensSold);
      await waitForPositionSizeUpdate(position.asset);
      Navigation.goBack();
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error selling position', error));
      setIsProcessing(false);
      Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_cash_out));

      analytics.track(analytics.event.predictionsPlaceOrderFailed, {
        eventSlug: position.eventSlug,
        marketSlug: position.slug,
        outcome: position.outcome,
        tokenId: position.asset,
        side: 'sell',
        errorMessage: error.message,
      });
    }
  }, [livePrice, position]);

  const handleClaimPosition = useCallback(async () => {
    try {
      await redeemPosition(position);
      refetchPolymarketStores();
      Navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error claiming position', e));
      setIsProcessing(false);
      Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_claim));
    }
  }, [position]);

  const onPressActionButton = useCallback(() => {
    setIsProcessing(true);
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return handleClaimPosition();
      case PositionAction.BURN:
        return handleClaimPosition();
      case PositionAction.CASH_OUT:
        return handleCashOutPosition();
    }
  }, [actionButtonType, handleCashOutPosition, handleClaimPosition]);

  const pnlColor = Number(livePnl) >= 0 ? green : red;
  const pnlSign = Number(livePnl) >= 0 ? '+' : '-';
  const absPnl = Math.abs(Number(livePnl));

  const gradientFillColors = isDarkMode
    ? [opacityWorklet(accentColor, 0.22), opacityWorklet(accentColor, 0)]
    : [opacityWorklet(accentColor, 0), opacityWorklet(accentColor, 0.06)];

  return (
    <PanelSheet
      innerBorderWidth={1}
      panelStyle={{ backgroundColor: isDarkMode ? globalColors.grey100 : opacityWorklet(globalColors.white100, 0.92) }}
    >
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
            {formatCurrency(livePositionValue)}
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
            borderColor={{ custom: opacityWorklet('#FFFFFF', 0.08) }}
            borderWidth={2}
            disabledBackgroundColor={'gray'}
            label={actionButtonLabel}
            processingLabel={actionButtonLoadingLabel}
            isProcessing={isProcessing}
            onLongPress={onPressActionButton}
            showBiometryIcon={false}
            height={48}
            color={'white'}
          />
        </Box>
      </Box>
    </PanelSheet>
  );
});
