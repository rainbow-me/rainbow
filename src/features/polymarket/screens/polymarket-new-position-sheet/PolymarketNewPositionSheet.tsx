import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analytics } from '@/analytics';
import { AmountInputCard } from '@/components/amount-input-card/AmountInputCard';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { Box, globalColors, Text, TextShadow, useColorMode } from '@/design-system';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { PolymarketNoLiquidityCard } from '@/features/polymarket/components/PolymarketNoLiquidityCard';
import { PolymarketOutcomeCard } from '@/features/polymarket/components/PolymarketOutcomeCard';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { getPolymarketClobOrderErrorReason, PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { useNewPositionForm } from '@/features/polymarket/screens/polymarket-new-position-sheet/hooks/useNewPositionForm';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { executePolymarketBuyPosition, type PolymarketBuyPositionStep } from '@/features/polymarket/utils/executePolymarketBuyPosition';
import { getOutcomeDescriptions } from '@/features/polymarket/utils/getOutcomeDescriptions';
import { trackPolymarketOrder } from '@/features/polymarket/utils/polymarketOrderTracker';
import { waitForPositionSizeUpdate } from '@/features/polymarket/utils/refetchPolymarketStores';
import { mulWorklet, toFixedWorklet, trimTrailingZeros } from '@/framework/core/safeMath';
import { opacity } from '@/framework/ui/utils/opacity';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { checkIfReadOnlyWallet } from '@/state/wallets/walletsStore';
import { getSolidColorEquivalent } from '@/worklets/colors';

export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const {
    params: { market, event, outcomeIndex, outcomeColor, fromRoute },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const hasBalance = usePolymarketBalanceStore(state => Number(state.getBalance()) > 0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState(getBuyPositionProcessingLabel('preparing'));

  const outcome = market.outcomes[outcomeIndex];
  const tokenId = market.clobTokenIds[outcomeIndex];
  const accentColor = outcomeColor;
  const buttonColor = getSolidColorEquivalent({
    background: opacity(accentColor, 0.7),
    foreground: '#000000',
    opacity: 0.4,
  });

  const {
    availableBalance,
    bestPrice,
    worstPrice,
    validation,
    isValidOrderAmount,
    amountToWin,
    fee,
    spread,
    setBuyAmount,
    buyAmount,
    averagePrice,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
  } = useNewPositionForm({ tokenId, conditionId: market.conditionId });

  const hasBlockedLiquidity = hasNoLiquidityAtMarketPrice || hasInsufficientLiquidity;
  const noLiquidityTitle = hasNoLiquidityAtMarketPrice
    ? i18n.t(i18n.l.predictions.new_position.no_liquidity_title)
    : i18n.t(i18n.l.predictions.new_position.insufficient_liquidity_title);
  const noLiquidityDescription = hasNoLiquidityAtMarketPrice
    ? i18n.t(i18n.l.predictions.new_position.no_liquidity_description)
    : i18n.t(i18n.l.predictions.new_position.insufficient_liquidity_description);

  const { title: outcomeTitle, subtitle: outcomeSubtitle } = getOutcomeDescriptions({
    eventTitle: event.title,
    market,
    outcome,
    outcomeIndex,
  });

  const formattedAveragePrice = `${trimTrailingZeros(toFixedWorklet(mulWorklet(averagePrice, 100), 1))}¢`;
  const formattedSpread = `${trimTrailingZeros(toFixedWorklet(mulWorklet(spread, 100), 1))}¢`;

  const handleMarketBuyPosition = useCallback(async () => {
    if (hasBlockedLiquidity) return;
    if (checkIfReadOnlyWallet(usePolymarketClients.getState().address)) return;
    setIsProcessing(true);
    setProcessingLabel(getBuyPositionProcessingLabel('preparing'));
    try {
      const orderResult = await executePolymarketBuyPosition({
        tokenId,
        amount: buyAmount,
        price: worstPrice,
        negRisk: market.negRisk,
        onStep: step => setProcessingLabel(getBuyPositionProcessingLabel(step)),
      });
      trackPolymarketOrder({
        orderResult,
        context: {
          eventSlug: event.slug,
          marketSlug: market.slug,
          outcome,
          tokenId,
          side: 'buy',
          estimatedFeeAmountUsd: fee,
          spread,
          bestPriceUsd: bestPrice,
          orderPriceUsd: worstPrice,
        },
      });
      setProcessingLabel(getBuyPositionProcessingLabel('confirming_order'));
      await waitForPositionSizeUpdate(tokenId);
      if (fromRoute === Routes.POLYMARKET_MARKET_SHEET) {
        Navigation.goBack();
        Navigation.goBack();
      } else {
        Navigation.goBack();
      }
    } catch (e) {
      const error = ensureError(e);

      logger.error(new RainbowError('[PolymarketNewPositionSheet] Error buying position', error));
      analytics.track(analytics.event.predictionsPlaceOrderFailed, {
        eventSlug: event.slug,
        marketSlug: market.slug,
        outcome,
        orderAmountUsd: Number(buyAmount),
        feeAmountUsd: Number(fee),
        orderPriceUsd: Number(worstPrice),
        tokenId,
        side: 'buy',
        errorMessage: error.message,
      });

      presentErrorAlert(error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    bestPrice,
    buyAmount,
    event.slug,
    fee,
    market.negRisk,
    market.slug,
    outcome,
    spread,
    tokenId,
    worstPrice,
    fromRoute,
    hasBlockedLiquidity,
  ]);

  const handleDepositFunds = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_DEPOSIT_SCREEN);
  }, []);

  return (
    <PanelSheet innerBorderWidth={1} enableKeyboardAvoidance keyboardAvoidanceOffset={{ opened: safeAreaInsets.bottom }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? globalColors.grey100 : POLYMARKET_BACKGROUND_LIGHT }]}>
        <LinearGradient
          colors={
            isDarkMode ? [opacity(accentColor, 0.22), opacity(accentColor, 0)] : [opacity(accentColor, 0), opacity(accentColor, 0.06)]
          }
          style={StyleSheet.absoluteFill}
          start={isDarkMode ? { x: 0, y: 0 } : { x: 0, y: 0.12 }}
          end={isDarkMode ? { x: 0, y: 1 } : { x: 0, y: 0.82 }}
        />
      </View>
      <Box paddingHorizontal="32px" paddingBottom={'24px'} paddingTop={{ custom: 43 }}>
        <Box gap={28}>
          <Text size="26pt" weight="heavy" color="label">
            {i18n.t(i18n.l.predictions.new_position.title)}
          </Text>
          <Box gap={12}>
            <PolymarketOutcomeCard
              accentColor={accentColor}
              icon={market.icon}
              outcomeTitle={outcomeTitle}
              outcomeSubtitle={outcomeSubtitle}
              groupItemTitle={market.groupItemTitle}
              outcome={outcome}
              outcomeIndex={outcomeIndex}
            />
            <AmountInputCard
              availableBalance={availableBalance}
              accentColor={accentColor}
              backgroundColor={isDarkMode ? opacity(accentColor, 0.08) : opacity(globalColors.white100, 0.9)}
              onAmountChange={setBuyAmount}
              title={i18n.t(i18n.l.predictions.new_position.amount)}
              validation={validation}
            />
          </Box>
          <Box gap={24}>
            {/* For testing purposes */}
            {/* <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'Fees'}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {formatUsd(fee)}
                </Text>
              </TextShadow>
            </Box> */}
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.predictions.new_position.spread)}
              </Text>
              <Text size="17pt" weight="bold" color={'label'}>
                {formattedSpread}
              </Text>
            </Box>

            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.predictions.new_position.average_price)}
              </Text>
              <Text size="17pt" weight="bold" color="label">
                {formattedAveragePrice}
              </Text>
            </Box>

            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {i18n.t(i18n.l.predictions.new_position.to_win)}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {formatUsd(amountToWin)}
                </Text>
              </TextShadow>
            </Box>
          </Box>
          {hasBlockedLiquidity && <PolymarketNoLiquidityCard title={noLiquidityTitle} description={noLiquidityDescription} />}
          {hasBalance ? (
            <HoldToActivateButton
              onLongPress={handleMarketBuyPosition}
              label={i18n.t(i18n.l.predictions.new_position.hold_to_place_bet)}
              processingLabel={processingLabel}
              isProcessing={isProcessing}
              showBiometryIcon={false}
              backgroundColor={buttonColor}
              disabledBackgroundColor={opacity(buttonColor, 0.02)}
              disabled={!isValidOrderAmount || hasBlockedLiquidity}
              height={48}
              borderColor={{ custom: opacity('#FFFFFF', 0.08) }}
              borderWidth={2}
              color={hasBlockedLiquidity ? 'labelQuaternary' : 'white'}
              progressColor="white"
            />
          ) : (
            <ButtonPressAnimation onPress={handleDepositFunds} scaleTo={0.96}>
              <Box
                alignItems="center"
                justifyContent="center"
                height={48}
                borderRadius={24}
                backgroundColor={buttonColor}
                borderColor={{ custom: opacity('#FFFFFF', 0.08) }}
                borderWidth={2}
              >
                <Text color="white" size="20pt" weight="black">
                  {i18n.t(i18n.l.predictions.new_position.deposit_funds)}
                </Text>
              </Box>
            </ButtonPressAnimation>
          )}
        </Box>
      </Box>
    </PanelSheet>
  );
});

function getBuyPositionProcessingLabel(step: PolymarketBuyPositionStep): string {
  switch (step) {
    case 'confirming_order':
      return i18n.t(i18n.l.predictions.new_position.confirming_order);
    case 'preparing':
    case 'placing_order':
      return i18n.t(i18n.l.predictions.new_position.placing_bet);
  }
}

function presentErrorAlert(error: Error) {
  const clobOrderErrorReason = getPolymarketClobOrderErrorReason(error);

  if (clobOrderErrorReason) {
    if (clobOrderErrorReason === 'not_enough_liquidity') {
      Alert.alert(
        i18n.t(i18n.l.predictions.new_position.errors.not_enough_liquidity),
        i18n.t(i18n.l.predictions.new_position.errors.please_lower_amount)
      );
    } else if (clobOrderErrorReason === 'no_liquidity_at_price') {
      Alert.alert(
        i18n.t(i18n.l.predictions.new_position.errors.no_liquidity_at_price),
        i18n.t(i18n.l.predictions.new_position.errors.please_lower_amount)
      );
    }
    return;
  }

  if (error instanceof PolymarketBuyPositionError) {
    if (error.reason === 'trading_approval_failed') {
      Alert.alert(
        i18n.t(i18n.l.predictions.new_position.errors.trading_approval_failed_title),
        i18n.t(i18n.l.predictions.new_position.errors.trading_approval_failed_message)
      );
    } else if (error.reason === 'collateral_conversion_failed') {
      Alert.alert(
        i18n.t(i18n.l.predictions.new_position.errors.collateral_conversion_failed_title),
        i18n.t(i18n.l.predictions.new_position.errors.collateral_conversion_failed_message)
      );
    }
    return;
  }

  Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_place_bet));
}
