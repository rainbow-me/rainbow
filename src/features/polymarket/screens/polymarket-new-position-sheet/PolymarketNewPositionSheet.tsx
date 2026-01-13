import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box } from '@/design-system/components/Box/Box';
import { globalColors } from '@/design-system/color/palettes';
import { Text } from '@/design-system/components/Text/Text';
import { TextShadow } from '@/design-system/components/TextShadow/TextShadow';
import { useColorMode } from '@/design-system/color/ColorMode';
import * as i18n from '@/languages';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { ensureError, logger, RainbowError } from '@/logger';
import { opacity } from '@/framework/ui/utils/opacity';
import { AmountInputCard } from '@/components/amount-input-card/AmountInputCard';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import LinearGradient from 'react-native-linear-gradient';
import { waitForPositionSizeUpdate } from '@/features/polymarket/utils/refetchPolymarketStores';
import { Navigation } from '@/navigation';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { useNewPositionForm } from '@/features/polymarket/screens/polymarket-new-position-sheet/hooks/useNewPositionForm';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { marketBuyToken } from '@/features/polymarket/utils/orders';
import { mulWorklet, subWorklet, toFixedWorklet, trimTrailingZeros } from '@/safe-math/SafeMath';
import { trackPolymarketOrder } from '@/features/polymarket/utils/polymarketOrderTracker';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { POLYMARKET_CLOB_API_ERRORS } from '@/features/polymarket/errors';
import { analytics } from '@/analytics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { checkIfReadOnlyWallet } from '@/state/wallets/walletsStore';
import { usePolymarketClients } from '@/features/polymarket/stores/derived/usePolymarketClients';
import { usePolymarketAccountValueSummary } from '@/features/polymarket/stores/derived/usePolymarketAccountValueSummary';
import { getOutcomeDescriptions } from '@/features/polymarket/utils/getOutcomeDescriptions';
import { PolymarketOutcomeCard } from '@/features/polymarket/components/PolymarketOutcomeCard';

export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const {
    params: { market, event, outcomeIndex, outcomeColor, fromRoute },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();
  const { isDarkMode } = useColorMode();
  const safeAreaInsets = useSafeAreaInsets();

  const hasBalance = usePolymarketAccountValueSummary(state => state.hasBalance);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState(i18n.t(i18n.l.predictions.new_position.placing_bet));

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
  } = useNewPositionForm({ tokenId });

  const { title: outcomeTitle, subtitle: outcomeSubtitle } = getOutcomeDescriptions({
    eventTitle: event.title,
    market,
    outcome,
    outcomeIndex,
  });

  const formattedAveragePrice = `${trimTrailingZeros(toFixedWorklet(mulWorklet(averagePrice, 100), 1))}¢`;
  const formattedSpread = `${trimTrailingZeros(toFixedWorklet(mulWorklet(spread, 100), 1))}¢`;

  const handleMarketBuyPosition = useCallback(async () => {
    if (checkIfReadOnlyWallet(usePolymarketClients.getState().address)) return;
    setIsProcessing(true);
    const amountToBuy = subWorklet(buyAmount, fee);
    try {
      const orderResult = await marketBuyToken({ tokenId, amount: amountToBuy, price: worstPrice });
      setProcessingLabel(i18n.t(i18n.l.predictions.new_position.confirming_order));
      trackPolymarketOrder({
        orderResult,
        context: {
          eventSlug: event.slug,
          marketSlug: market.slug,
          outcome,
          tokenId,
          side: 'buy',
          spread,
          bestPriceUsd: bestPrice,
          orderPriceUsd: worstPrice,
        },
      });
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

      if (error.message === POLYMARKET_CLOB_API_ERRORS.FOK_ORDER_NOT_FILLED) {
        Alert.alert(
          i18n.t(i18n.l.predictions.new_position.errors.not_enough_liquidity),
          i18n.t(i18n.l.predictions.new_position.errors.please_lower_amount)
        );
      } else if (error.message === POLYMARKET_CLOB_API_ERRORS.NO_MATCH) {
        Alert.alert(
          i18n.t(i18n.l.predictions.new_position.errors.no_liquidity_at_price),
          i18n.t(i18n.l.predictions.new_position.errors.please_lower_amount)
        );
      } else {
        Alert.alert(i18n.t(i18n.l.predictions.errors.title), i18n.t(i18n.l.predictions.errors.failed_to_place_bet));
      }

      analytics.track(analytics.event.predictionsPlaceOrderFailed, {
        eventSlug: event.slug,
        marketSlug: market.slug,
        outcome,
        orderAmountUsd: Number(amountToBuy),
        feeAmountUsd: Number(fee),
        orderPriceUsd: Number(worstPrice),
        tokenId,
        side: 'buy',
        errorMessage: error.message,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [bestPrice, buyAmount, event.slug, fee, market.slug, outcome, spread, tokenId, worstPrice, fromRoute]);

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
                  {formatCurrency(fee)}
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
                  {formatCurrency(amountToWin)}
                </Text>
              </TextShadow>
            </Box>
          </Box>
          {hasBalance ? (
            <HoldToActivateButton
              onLongPress={handleMarketBuyPosition}
              label={i18n.t(i18n.l.predictions.new_position.hold_to_place_bet)}
              processingLabel={processingLabel}
              isProcessing={isProcessing}
              showBiometryIcon={false}
              backgroundColor={buttonColor}
              disabledBackgroundColor={opacity(accentColor, 0.12)}
              disabled={!isValidOrderAmount}
              height={48}
              borderColor={{ custom: opacity('#FFFFFF', 0.08) }}
              borderWidth={2}
              textStyle={{
                color: 'white',
                fontSize: 20,
                fontWeight: '900',
              }}
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
