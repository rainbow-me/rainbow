import { memo, useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, Text, TextShadow } from '@/design-system';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClobClient';
import { Side, OrderType } from '@polymarket/clob-client';
import { ensureError, logger, RainbowError } from '@/logger';
import ImgixImage from '@/components/images/ImgixImage';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { AmountInputCard } from '@/components/amount-input-card/AmountInputCard';
import {
  divWorklet,
  greaterThanWorklet,
  lessThanWorklet,
  maxWorklet,
  mulWorklet,
  toFixedWorklet,
  toPercentageWorklet,
} from '@/safe-math/SafeMath';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import LinearGradient from 'react-native-linear-gradient';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { useDerivedValue } from 'react-native-reanimated';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { Navigation } from '@/navigation';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getPolymarketTokenId } from '@/state/liveTokens/polymarketAdapter';

export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const {
    params: { market, outcome },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();
  const availableBalance = usePolymarketBalanceStore(state => state.getBalance());
  const accentColor = market.color;

  const [amount, setAmount] = useState(() => {
    const halfBalance = divWorklet(availableBalance, 2);
    const initialAmount = greaterThanWorklet(availableBalance, '5') ? halfBalance : availableBalance;
    return toFixedWorklet(initialAmount, 2);
  });

  const outcomeIndex = useMemo(() => {
    return market.outcomes.indexOf(outcome);
  }, [market.outcomes, outcome]);

  const tokenId = useMemo(() => {
    return market.clobTokenIds[outcomeIndex];
  }, [market.clobTokenIds, outcomeIndex]);

  const liveOrderPrice = useLiveTokenValue({
    tokenId: getPolymarketTokenId(tokenId),
    initialValue: String(formatOrderPrice(Number(market.outcomePrices[outcomeIndex]), market.orderPriceMinTickSize)),
    selector: token => String(formatOrderPrice(Number(token.price), market.orderPriceMinTickSize)),
  });

  const minBuyAmountUsd = useMemo(() => {
    return mulWorklet(market.orderMinSize, liveOrderPrice);
  }, [market.orderMinSize, liveOrderPrice]);

  const validation = useDerivedValue(() => {
    'worklet';

    const maxAmount = String(availableBalance);
    const minAmount = String(maxWorklet(minBuyAmountUsd, '1'));

    const isAboveMax = greaterThanWorklet(amount, maxAmount);
    const isBelowMin = lessThanWorklet(amount, minAmount);

    const isValid = !isAboveMax && !isBelowMin;

    return {
      isAboveMax,
      isBelowMin,
      isValid,
      maxAmount,
      minAmount,
    };
  });

  const isValidOrderAmount = useDerivedValue(() => {
    'worklet';
    return validation.value.isValid;
  });

  const [isValidOrderAmountState, setIsValidOrderAmountState] = useState(false);

  useSyncSharedValue({
    setState: setIsValidOrderAmountState,
    sharedValue: isValidOrderAmount,
    state: isValidOrderAmountState,
    syncDirection: 'sharedValueToState',
  });

  const outcomeOdds = useMemo(() => {
    return toPercentageWorklet(liveOrderPrice);
  }, [liveOrderPrice]);

  const amountToWin = useMemo(() => {
    const estimatedPositionSize = divWorklet(amount, liveOrderPrice);
    // If you win, each unit of the position is worth $1.
    return formatCurrency(estimatedPositionSize);
  }, [amount, liveOrderPrice]);

  const handleMarketBuyPosition = useCallback(async () => {
    try {
      const result = await marketBuyPosition({ tokenId, amount: Number(amount), price: Number(liveOrderPrice) });
      // console.log('Order result', JSON.stringify(result, null, 2));
      // When the order is rejected for some valid reason - like the total amount was not filled on a fill or kill order - the error will be returned in the result.
      if ('error' in result) {
        throw new RainbowError(result.error);
      }
      setTimeout(async () => {
        await refetchPolymarketStores();
      }, 1000);
      Navigation.goBack();
      Navigation.goBack();
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[PolymarketNewPositionSheet] Error buying position', error), {
        message: error.message,
      });
      // TODO: Show error to user
    }
  }, [amount, liveOrderPrice, tokenId]);

  const outcomeSubtitle = useMemo(() => {
    if (outcome !== 'Yes' && outcome !== 'No') {
      if (market.line) {
        return `${outcome} ${market.line}`;
      }
    } else if (market.groupItemTitle) {
      return market.groupItemTitle;
    }
    return outcome;
  }, [market.groupItemTitle, outcome, market.line]);

  return (
    <PanelSheet innerBorderWidth={1} enableKeyboardAvoidance>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#000000' }]} />
        <View style={[StyleSheet.absoluteFillObject, { opacity: 0.22 }]}>
          <LinearGradient
            colors={[accentColor, opacityWorklet(accentColor, 0)]}
            style={StyleSheet.absoluteFillObject}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
        </View>
      </View>
      <Box paddingHorizontal="32px" paddingBottom={'24px'} paddingTop={{ custom: 43 }}>
        <Box gap={28}>
          <Text size="26pt" weight="heavy" color="label">
            {'Place Bet'}
          </Text>
          <Box gap={24}>
            <Box
              padding={'20px'}
              backgroundColor={opacityWorklet(accentColor, 0.16)}
              borderRadius={26}
              borderColor={{ custom: opacityWorklet(accentColor, 0.03) }}
              borderWidth={2.5}
            >
              <Box flexDirection="row" alignItems="center" gap={12}>
                <ImgixImage
                  enableFasterImage
                  resizeMode="cover"
                  size={38}
                  source={{ uri: market.icon }}
                  style={{ height: 38, width: 38, borderRadius: 10 }}
                />
                <Box gap={12} style={{ flex: 1 }}>
                  <Text size="15pt" weight="bold" color="labelTertiary" style={{ flex: 1 }}>
                    {market.events?.[0]?.title || market.question}
                  </Text>
                  <Text size="17pt" weight="bold" color="label">
                    {outcomeSubtitle}
                  </Text>
                </Box>
              </Box>
            </Box>
            <AmountInputCard
              availableBalance={availableBalance}
              accentColor={accentColor}
              backgroundColor={opacityWorklet(accentColor, 0.08)}
              onAmountChange={setAmount}
              resetKey="polymarket-new-position-sheet"
              title="Amount"
              validation={validation}
            />
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'Chance of Outcome'}
              </Text>
              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color={{ custom: accentColor }}>
                  {`${outcomeOdds}%`}
                </Text>
              </TextShadow>
            </Box>
            <Box flexDirection="row" justifyContent="space-between" paddingHorizontal="16px">
              <Text size="15pt" weight="semibold" color="labelTertiary">
                {'To Win'}
              </Text>

              <TextShadow blur={6} shadowOpacity={0.24}>
                <Text size="17pt" weight="heavy" color="green">
                  {amountToWin}
                </Text>
              </TextShadow>
            </Box>
            <HoldToActivateButton
              onLongPress={handleMarketBuyPosition}
              label="Hold to Place Bet"
              processingLabel="Placing Bet..."
              isProcessing={false}
              showBiometryIcon={false}
              backgroundColor={accentColor}
              disabledBackgroundColor={opacityWorklet(accentColor, 0.12)}
              disabled={!isValidOrderAmountState}
              height={48}
              textStyle={{
                color: 'white',
                fontSize: 20,
                fontWeight: '900',
              }}
              progressColor="white"
            />
          </Box>
        </Box>
      </Box>
    </PanelSheet>
  );
});

/**
 * Successful order result:
{
  "errorMsg": "",
  "orderID": "0xb33730e62e3b884fc40a2b6b1e346c5e33430055a74c320e14d32eb320659ece",
  "takingAmount": "5.301885",
  "makingAmount": "2.809999",
  "status": "matched",
  "transactionsHashes": [
    "0x044c79c36506f683945097e5902c4e7b53c6b40cd763fb04cf7cd6a39e3781c8"
  ],
  "success": true
}
Error order result:
{
  "error": "order couldn't be fully filled. FOK orders are fully filled or killed.",
  "status": 400
}
*/

// TODO: create types for order result
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function marketBuyPosition({ tokenId, amount, price }: { tokenId: string; amount: number; price: number }): Promise<any> {
  const client = await getPolymarketClobClient();
  const order = await client.createMarketOrder({
    side: Side.BUY,
    tokenID: tokenId,
    amount,
    price,
  });

  return await client.postOrder(order, OrderType.FOK);
}

function formatOrderPrice(price: number, minTickSize: number): number {
  const decimals = Math.round(-Math.log10(minTickSize));
  const roundedPrice = Math.ceil(price / minTickSize) * minTickSize;
  return Number(roundedPrice.toFixed(decimals));
}
