import { memo, useCallback, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useRoute, type RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { analytics } from '@/analytics';
import { AmountInputCard } from '@/components/amount-input-card/AmountInputCard';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { useColorMode } from '@/design-system/color/ColorMode';
import { globalColors } from '@/design-system/color/palettes';
import { Box } from '@/design-system/components/Box/Box';
import { Text } from '@/design-system/components/Text/Text';
import { TextShadow } from '@/design-system/components/TextShadow/TextShadow';
import { opacity } from '@/design-system/utils/opacity';
import { formatUsd } from '@/features/currency/utils/formatUsd';
import { INPUT_CARD_HEIGHT } from '@/features/perps/constants';
import { PolymarketNoLiquidityCard } from '@/features/polymarket/components/PolymarketNoLiquidityCard';
import { POLYMARKET_OUTCOME_CARD_MIN_HEIGHT, PolymarketOutcomeCard } from '@/features/polymarket/components/PolymarketOutcomeCard';
import { POLYMARKET_BACKGROUND_LIGHT } from '@/features/polymarket/constants';
import { getPolymarketClobOrderErrorReason, PolymarketBuyPositionError } from '@/features/polymarket/errors';
import { useNewPositionForm } from '@/features/polymarket/screens/polymarket-new-position-sheet/hooks/useNewPositionForm';
import { retryPolymarketBalance, useAvailablePolymarketBalance } from '@/features/polymarket/stores/derived/useAvailablePolymarketBalance';
import { usePolymarketOrderStore, type PolymarketOrderDetails } from '@/features/polymarket/stores/polymarketOrderStore';
import { getOutcomeDescriptions } from '@/features/polymarket/utils/getOutcomeDescriptions';
import { executePolymarketBuyPosition, type PolymarketBuyPositionStep } from '@/features/polymarket/utils/polymarketOrderExecution';
import { waitForPositionSizeUpdate } from '@/features/polymarket/utils/refetchPolymarketStores';
import { isPositive, mulWorklet, toFixedWorklet, trimTrailingZeros } from '@/framework/core/safeMath';
import * as i18n from '@/languages';
import { ensureError, logger, RainbowError } from '@/logger';
import Navigation from '@/navigation/Navigation';
import Routes, { type Route } from '@/navigation/routesNames';
import { type RootStackParamList } from '@/navigation/types';
import { checkIfReadOnlyWallet, getAccountAddress } from '@/state/wallets/walletsStore';
import { getSolidColorEquivalent, white } from '@/worklets/colors';

type BetSubmission = {
  balance: string;
  step: PolymarketBuyPositionStep;
};

const BUTTON_BORDER_COLOR = { custom: white(0.08) };

/**
 * The sheet for opening a Polymarket position.
 */
export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const { params } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();
  const safeAreaInsets = useSafeAreaInsets();
  const { isDarkMode } = useColorMode();
  const accentColor = params.accentColor[isDarkMode ? 'dark' : 'light'];

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
      <Box paddingHorizontal="32px" paddingBottom="24px" paddingTop={{ custom: 43 }}>
        <Box gap={28}>
          <Text size="26pt" weight="heavy" color="label">
            {i18n.t(i18n.l.predictions.new_position.title)}
          </Text>
          <NewPositionContent params={params} accentColor={accentColor} />
        </Box>
      </Box>
    </PanelSheet>
  );
});

function NewPositionContent({
  params,
  accentColor,
}: {
  params: RootStackParamList[typeof Routes.POLYMARKET_NEW_POSITION_SHEET];
  accentColor: string;
}) {
  const outcome = 'outcome' in params ? params.outcome : null;
  const routeDetails = 'market' in params ? params : null;

  const fetchedDetails = usePolymarketOrderStore(s => s.getData({ outcome }));
  const loadingDetails = usePolymarketOrderStore(s => s.getStatus('isInitialLoad') || s.getStatus('isLoading'));
  const { balance, isError } = useAvailablePolymarketBalance();

  const details = routeDetails ?? fetchedDetails;

  if (!details) {
    if (loadingDetails) return <NewPositionSkeleton accentColor={accentColor} />;

    return <BetDetailsError onRetry={() => usePolymarketOrderStore.getState().fetch({ outcome }, { force: true })} />;
  }

  if (balance === null) {
    return isError ? <BetDetailsError onRetry={retryPolymarketBalance} /> : <NewPositionSkeleton accentColor={accentColor} />;
  }

  return (
    <NewPositionForm
      key={details.market.clobTokenIds[details.outcomeIndex]}
      accentColor={accentColor}
      balance={balance}
      details={details}
      fromRoute={params.fromRoute}
    />
  );
}

function NewPositionForm({
  accentColor,
  balance,
  details,
  fromRoute,
}: {
  accentColor: string;
  balance: string;
  details: PolymarketOrderDetails;
  fromRoute: Route;
}) {
  const { event, market, outcomeIndex } = details;
  const { isDarkMode } = useColorMode();
  const [submission, setSubmission] = useState<BetSubmission | null>(null);
  const availableBalance = submission?.balance ?? balance;

  const outcome = market.outcomes[outcomeIndex];
  const tokenId = market.clobTokenIds[outcomeIndex];
  const buttonColor = getButtonColor(accentColor);

  const {
    bestPrice,
    worstPrice,
    validation,
    isValidOrderAmount,
    amountToWin,
    fee,
    orderSpendCap,
    rainbowFee,
    spread,
    setBuyAmount,
    buyAmount,
    averagePrice,
    hasNoLiquidityAtMarketPrice,
    hasInsufficientLiquidity,
    isQuoteReady,
  } = useNewPositionForm(availableBalance);

  const hasBlockedLiquidity = hasNoLiquidityAtMarketPrice || hasInsufficientLiquidity;
  const canSubmit = isValidOrderAmount && isQuoteReady && !hasBlockedLiquidity;

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

  const handleMarketBuyPosition = useCallback(async () => {
    if (!canSubmit || checkIfReadOnlyWallet(getAccountAddress())) return;

    const onStep = (step: PolymarketBuyPositionStep) => setSubmission({ balance: availableBalance, step });

    try {
      await executePolymarketBuyPosition({
        tokenId,
        amount: orderSpendCap,
        price: worstPrice,
        negRisk: market.negRisk,
        version: market.version,
        matchedOrderMetadata: {
          eventSlug: event.slug,
          marketSlug: market.slug,
          outcome,
          estimatedFeeAmountUsd: fee,
          quotedTradeFeeUsd: rainbowFee,
          spread,
          bestPriceUsd: bestPrice,
          orderPriceUsd: worstPrice,
        },
        onStep,
      });

      onStep('confirming_order');
      await waitForPositionSizeUpdate(tokenId);

      Navigation.goBack();
      if (fromRoute === Routes.POLYMARKET_MARKET_SHEET) Navigation.goBack();
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
      setSubmission(null);
    }
  }, [
    availableBalance,
    bestPrice,
    buyAmount,
    canSubmit,
    event.slug,
    fee,
    fromRoute,
    market.negRisk,
    market.version,
    market.slug,
    orderSpendCap,
    outcome,
    rainbowFee,
    spread,
    tokenId,
    worstPrice,
  ]);

  const handleDepositFunds = useCallback(() => {
    Navigation.handleAction(Routes.POLYMARKET_DEPOSIT_SCREEN);
  }, []);

  return (
    <>
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
          backgroundColor={isDarkMode ? opacity(accentColor, 0.08) : white(0.9)}
          onAmountChange={setBuyAmount}
          title={i18n.t(i18n.l.predictions.new_position.amount)}
          validation={validation}
        />
      </Box>
      <OrderSummary
        averagePrice={isQuoteReady ? averagePrice : undefined}
        spread={isQuoteReady ? spread : undefined}
        amountToWin={isQuoteReady ? amountToWin : undefined}
      />
      {hasBlockedLiquidity ? <PolymarketNoLiquidityCard title={noLiquidityTitle} description={noLiquidityDescription} /> : null}
      {isPositive(availableBalance) ? (
        <HoldToActivateButton
          onLongPress={handleMarketBuyPosition}
          label={i18n.t(i18n.l.predictions.new_position.hold_to_place_bet)}
          processingLabel={submission ? getBuyPositionProcessingLabel(submission.step) : ''}
          isProcessing={submission !== null}
          showBiometryIcon={false}
          backgroundColor={buttonColor}
          disabledBackgroundColor={buttonColor}
          disabled={!canSubmit}
          height={48}
          borderColor={BUTTON_BORDER_COLOR}
          borderWidth={2}
          color={canSubmit ? 'white' : { custom: globalColors.white50 }}
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
            borderColor={BUTTON_BORDER_COLOR}
            borderWidth={2}
          >
            <Text color="white" size="20pt" weight="black">
              {i18n.t(i18n.l.predictions.new_position.deposit_funds)}
            </Text>
          </Box>
        </ButtonPressAnimation>
      )}
    </>
  );
}

function OrderSummary({ averagePrice, spread, amountToWin }: { averagePrice?: string; spread?: string; amountToWin?: string }) {
  const formattedAveragePrice =
    averagePrice === undefined ? '—' : `${trimTrailingZeros(toFixedWorklet(mulWorklet(averagePrice, 100), 1))}¢`;
  const formattedSpread = spread === undefined ? '—' : `${trimTrailingZeros(toFixedWorklet(mulWorklet(spread, 100), 1))}¢`;

  return (
    <Box gap={24}>
      <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
        <Text size="15pt" weight="semibold" color="labelTertiary">
          {i18n.t(i18n.l.predictions.new_position.spread)}
        </Text>
        <Text size="17pt" weight="bold" color="label">
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
            {amountToWin === undefined ? '—' : formatUsd(amountToWin)}
          </Text>
        </TextShadow>
      </Box>
    </Box>
  );
}

function BetDetailsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Box alignItems="center" gap={20} paddingVertical="28px">
      <Text align="center" color="labelSecondary" size="17pt" weight="bold">
        {i18n.t(i18n.l.sports.entry_error)}
      </Text>
      <ButtonPressAnimation onPress={onRetry}>
        <Box background="fillTertiary" borderRadius={22} height={44} paddingHorizontal="20px" justifyContent="center">
          <Text color="accent" size="17pt" weight="bold">
            {i18n.t(i18n.l.sports.retry)}
          </Text>
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
}

function NewPositionSkeleton({ accentColor }: { accentColor: string }) {
  const { isDarkMode } = useColorMode();
  const cardColor = isDarkMode ? opacity(accentColor, 0.08) : white(0.9);

  return (
    <>
      <Box gap={12}>
        <Box
          height={POLYMARKET_OUTCOME_CARD_MIN_HEIGHT}
          backgroundColor={cardColor}
          borderRadius={26}
          padding="20px"
          flexDirection="row"
          alignItems="center"
          gap={12}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Box width={38} height={38} borderRadius={10} background="fillTertiary" />
          <Box gap={12} style={styles.flex}>
            <Box width="full" height={10} borderRadius={4} background="fillTertiary" />
            <Box style={styles.skeletonSubtitle} height={12} borderRadius={4} background="fillTertiary" />
          </Box>
        </Box>
        <Box height={INPUT_CARD_HEIGHT} backgroundColor={cardColor} borderRadius={28} padding="20px" gap={20}>
          <Box flexDirection="row" alignItems="center" justifyContent="space-between">
            <Box gap={12}>
              <Text size="20pt" weight="heavy" color={{ custom: accentColor }}>
                {i18n.t(i18n.l.predictions.new_position.amount)}
              </Text>
              <Box width={96} height={12} borderRadius={4} background="fillTertiary" />
            </Box>
            <Box width={110} height={30} borderRadius={8} background="fillTertiary" />
          </Box>
          <Box width="full" height={10} borderRadius={10} background="fillTertiary" />
        </Box>
      </Box>
      <OrderSummary />
      <Box
        height={48}
        borderRadius={24}
        backgroundColor={getButtonColor(accentColor)}
        borderColor={BUTTON_BORDER_COLOR}
        borderWidth={2}
        alignItems="center"
        justifyContent="center"
        accessibilityState={{ disabled: true, busy: true }}
      >
        <Text size="20pt" weight="heavy" color={{ custom: globalColors.white50 }}>
          {i18n.t(i18n.l.predictions.new_position.hold_to_place_bet)}
        </Text>
      </Box>
    </>
  );
}

function getButtonColor(accentColor: string): string {
  return getSolidColorEquivalent({ background: accentColor, foreground: '#000000', opacity: 0.4 });
}

function getBuyPositionProcessingLabel(step: PolymarketBuyPositionStep): string {
  switch (step) {
    case 'confirming_order':
      return i18n.t(i18n.l.predictions.new_position.confirming_order);
    case 'preparing':
    case 'placing_order':
      return i18n.t(i18n.l.predictions.new_position.placing_bet);
  }
}

function presentErrorAlert(error: Error): void {
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  skeletonSubtitle: { width: '75%' },
});
