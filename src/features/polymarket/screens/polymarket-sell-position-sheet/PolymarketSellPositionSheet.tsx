import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, globalColors, Separator, Text, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { ensureError, logger, RainbowError } from '@/logger';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import LinearGradient from 'react-native-linear-gradient';
import { getColorValueForThemeWorklet, opacityWorklet } from '@/__swaps__/utils/swaps';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { mulWorklet, subWorklet, toFixedWorklet, trimTrailingZeros } from '@/safe-math/SafeMath';
import { marketSellTotalPosition } from '@/features/polymarket/utils/orders';
import { trackPolymarketOrder } from '@/features/polymarket/utils/polymarketOrderTracker';
import Navigation from '@/navigation/Navigation';
import { waitForPositionSizeUpdate } from '@/features/polymarket/utils/refetchPolymarketStores';
import { getPositionAccentColor } from '@/features/polymarket/utils/getMarketColor';
import { BlurView } from 'react-native-blur-view';
import { analytics } from '@/analytics';
import { checkIfReadOnlyWallet } from '@/state/wallets/walletsStore';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { createSellExecutionStore } from '@/features/polymarket/screens/polymarket-manage-position-sheet/stores/createSellExecutionStore';
import { usePolymarketOrderBookStore } from '@/features/polymarket/stores/polymarketOrderBookStore';
import { getOutcomeDescriptions } from '@/features/polymarket/utils/getOutcomeTitles';
import { PolymarketOutcomeCard } from '@/features/polymarket/components/PolymarketOutcomeCard';

export const PolymarketSellPositionSheet = memo(function PolymarketSellPositionSheet() {
  const {
    params: { position: initialPosition },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_SELL_POSITION_SHEET>>();

  const { isDarkMode } = useColorMode();
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState(i18n.t(i18n.l.predictions.manage_position.cashing_out));
  const position = usePolymarketPositionsStore(state => state.getPosition(initialPosition.asset) ?? initialPosition);
  const tokenId = useMemo(() => position.clobTokenIds[position.outcomes.indexOf(position.outcome)], [position]);
  const sellAmountTokens = String(position.size);

  const { title: outcomeTitle, subtitle: outcomeSubtitle } = getOutcomeDescriptions({
    eventTitle: position.market.events[0]?.title ?? '',
    market: position.market,
    outcome: position.outcome,
    outcomeIndex: position.outcomeIndex,
  });

  const accentColor = getColorValueForThemeWorklet(getPositionAccentColor(position), isDarkMode);
  const buttonBackgroundColor = getSolidColorEquivalent({
    background: opacityWorklet(accentColor, 0.7),
    foreground: '#000000',
    opacity: 0.4,
  });
  const gradientFillColors = isDarkMode
    ? [opacityWorklet(accentColor, 0.22), opacityWorklet(accentColor, 0)]
    : [opacityWorklet(accentColor, 0), opacityWorklet(accentColor, 0.06)];

  useEffect(() => {
    usePolymarketOrderBookStore.getState().setTokenId(tokenId);
    return () => usePolymarketOrderBookStore.getState().setTokenId(null);
  }, [tokenId]);

  const executionStore = useMemo(() => createSellExecutionStore(tokenId, sellAmountTokens), [tokenId, sellAmountTokens]);
  const { worstPrice, bestPrice, expectedPayoutUsd, averagePrice, fee, spread } = executionStore(state => state);
  const formattedBestPrice = `${trimTrailingZeros(toFixedWorklet(mulWorklet(bestPrice, 100), 1))}¢`;
  const formattedAveragePrice = `${trimTrailingZeros(toFixedWorklet(mulWorklet(averagePrice, 100), 1))}¢`;

  const pnl = useMemo(() => {
    return subWorklet(expectedPayoutUsd, position.initialValue);
  }, [expectedPayoutUsd, position.initialValue]);
  const pnlColor = Number(pnl) >= 0 ? green : red;
  const pnlSign = Number(pnl) >= 0 ? '+' : '-';
  const absPnl = Math.abs(Number(pnl));

  const handleCashOutPosition = useCallback(async () => {
    try {
      if (checkIfReadOnlyWallet(usePolymarketClients.getState().address)) return;
      const orderResult = await marketSellTotalPosition({ position, price: worstPrice });
      setProcessingLabel(i18n.t(i18n.l.predictions.manage_position.confirming_order));
      trackPolymarketOrder({
        orderResult,
        context: {
          eventSlug: position.eventSlug,
          marketSlug: position.slug,
          outcome: position.outcome,
          tokenId: position.asset,
          side: 'sell',
          orderPriceUsd: worstPrice,
          bestPriceUsd: bestPrice,
        },
      });
      await waitForPositionSizeUpdate(position.asset);
      Navigation.goBack();
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error selling position', error));
      Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_cash_out));

      analytics.track(analytics.event.predictionsPlaceOrderFailed, {
        eventSlug: position.eventSlug,
        marketSlug: position.slug,
        outcome: position.outcome,
        tokenId: position.asset,
        side: 'sell',
        errorMessage: error.message,
        orderPriceUsd: Number(worstPrice),
      });
    } finally {
      setIsProcessing(false);
    }
  }, [position, worstPrice, bestPrice]);

  return (
    <PanelSheet
      innerBorderWidth={1}
      panelStyle={{ backgroundColor: isDarkMode ? globalColors.grey100 : opacityWorklet(globalColors.white100, 0.92) }}
    >
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient colors={gradientFillColors} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
        {!isDarkMode && <BlurView style={StyleSheet.absoluteFill} blurIntensity={42} />}
      </View>
      <Box paddingHorizontal="24px" paddingBottom={'24px'} paddingTop={{ custom: 48 }}>
        <Box gap={24}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" width="full" paddingHorizontal={'12px'}>
            <Text size="20pt" weight="heavy" color={'label'}>
              {i18n.t(i18n.l.predictions.cash_out.title)}
            </Text>
            <Box gap={12} alignItems="flex-end">
              <Text size="15pt" weight="bold" color={'labelTertiary'}>
                {i18n.t(i18n.l.perps.common.current_price)}
              </Text>
              <Box flexDirection="row" alignItems="center" gap={4}>
                <Text size="15pt" weight="bold" color="label">
                  {formattedBestPrice}
                </Text>
              </Box>
            </Box>
          </Box>
          <PolymarketOutcomeCard
            accentColor={accentColor}
            icon={position.market.icon}
            outcomeTitle={outcomeTitle}
            outcomeSubtitle={outcomeSubtitle}
            groupItemTitle={position.market.groupItemTitle}
            outcome={position.outcome}
            outcomeIndex={position.outcomeIndex}
          />
          <Box gap={12}>
            <Box gap={12} paddingHorizontal="16px">
              <Box flexDirection="row" justifyContent="space-between">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {i18n.t(i18n.l.predictions.cash_out.spread)}
                </Text>
                <Text size="17pt" weight="bold" color="labelSecondary">
                  {`${mulWorklet(spread, 100)}¢`}
                </Text>
              </Box>
            </Box>
            <Box paddingHorizontal="16px">
              <Separator color="separatorTertiary" thickness={1} />
            </Box>
            <Box gap={12} paddingHorizontal="16px">
              <Box flexDirection="row" justifyContent="space-between">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {i18n.t(i18n.l.predictions.cash_out.average_price)}
                </Text>
                <Text size="17pt" weight="bold" color="labelSecondary">
                  {formattedAveragePrice}
                </Text>
              </Box>
            </Box>
            <Box paddingHorizontal="16px">
              <Separator color="separatorTertiary" thickness={1} />
            </Box>
            <Box gap={12} paddingHorizontal="16px">
              <Box flexDirection="row" justifyContent="space-between">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {i18n.t(i18n.l.predictions.cash_out.profit_loss)}
                </Text>
                <Text size="17pt" weight="bold" color={{ custom: pnlColor }}>
                  {pnlSign}
                  {formatCurrency(String(absPnl))}
                </Text>
              </Box>
            </Box>
            <Box paddingHorizontal="16px">
              <Separator color="separatorTertiary" thickness={1} />
            </Box>
            <Box gap={12} paddingHorizontal="16px">
              <Box flexDirection="row" justifyContent="space-between">
                <Text size="15pt" weight="bold" color="labelTertiary">
                  {i18n.t(i18n.l.predictions.cash_out.receive)}
                </Text>
                <Text size="17pt" weight="heavy" color="label">
                  {formatCurrency(expectedPayoutUsd)}
                </Text>
              </Box>
            </Box>
          </Box>
          <HoldToActivateButton
            backgroundColor={buttonBackgroundColor}
            borderColor={{ custom: opacityWorklet('#FFFFFF', 0.08) }}
            borderWidth={2}
            disabledBackgroundColor={'gray'}
            label={i18n.t(i18n.l.predictions.cash_out.cash_out)}
            processingLabel={processingLabel}
            isProcessing={isProcessing}
            onLongPress={handleCashOutPosition}
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
