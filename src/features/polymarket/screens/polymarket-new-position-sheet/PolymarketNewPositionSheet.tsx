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
import { divWorklet, greaterThanWorklet, toFixedWorklet, toPercentageWorklet } from '@/safe-math/SafeMath';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import LinearGradient from 'react-native-linear-gradient';
import { usePolymarketBalanceStore } from '@/features/polymarket/stores/polymarketBalanceStore';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';

export const PolymarketNewPositionSheet = memo(function PolymarketNewPositionSheet() {
  const {
    params: { market, outcome },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_NEW_POSITION_SHEET>>();
  const polymarketAvailableBalance = usePolymarketBalanceStore(state => state.getBalance());
  const [amount, setAmount] = useState(() => {
    const halfBalance = divWorklet(polymarketAvailableBalance, 2);
    const initialAmount = greaterThanWorklet(polymarketAvailableBalance, '5') ? halfBalance : polymarketAvailableBalance;
    return toFixedWorklet(initialAmount, 2);
  });

  const accentColor = market.seriesColor ?? '#3ECFAD';

  const outcomeIndex = market.outcomes.indexOf(outcome);

  const tokenId = useMemo(() => {
    return market.clobTokenIds[outcomeIndex];
  }, [market.clobTokenIds, outcomeIndex]);

  const outcomeOdds = useMemo(() => {
    const outcomePrice = Number(market.outcomePrices[outcomeIndex]);
    return toPercentageWorklet(outcomePrice);
  }, [market.outcomePrices, outcomeIndex]);

  const amountToWin = useMemo(() => {
    const outcomePrice = Number(market.outcomePrices[outcomeIndex]);
    const estimatedPositionSize = divWorklet(amount, outcomePrice);
    // If you win, each unit of the position is worth $1.
    return formatCurrency(estimatedPositionSize);
  }, [amount, market.outcomePrices, outcomeIndex]);

  const handleMarketBuyPosition = useCallback(async () => {
    try {
      const price = formatOrderPrice(Number(market.outcomePrices[outcomeIndex]), market.orderPriceMinTickSize);
      // console.log('market', JSON.stringify(market, null, 2));
      const result = await marketBuyPosition({ tokenId, amount: Number(amount), price });
      console.log('Order result', JSON.stringify(result, null, 2));
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[PolymarketNewPositionSheet] Error buying position', error), {
        message: error.message,
      });
      // TODO: Show error to user
    }
  }, [amount, market.orderPriceMinTickSize, market.outcomePrices, outcomeIndex, tokenId]);

  return (
    <PanelSheet innerBorderWidth={1}>
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
                  resizeMode="cover"
                  size={38}
                  source={{ uri: market.icon }}
                  style={{ height: 38, width: 38, borderRadius: 10 }}
                />
                <Box gap={12} style={{ flex: 1 }}>
                  <Text size="15pt" weight="bold" color="label" numberOfLines={1} style={{ flex: 1 }}>
                    {market.events?.[0]?.title ?? market.question}
                  </Text>
                  <Text size="15pt" weight="bold" color="labelQuaternary">
                    {market.groupItemTitle}
                  </Text>
                </Box>
              </Box>
            </Box>
            <AmountInputCard
              availableBalance={polymarketAvailableBalance}
              accentColor={accentColor}
              backgroundColor={opacityWorklet(accentColor, 0.08)}
              onAmountChange={setAmount}
              resetKey="polymarket-new-position-sheet"
              title="Amount"
              // validation={validation}
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
              disabled={false}
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

async function marketBuyPosition({ tokenId, amount, price }: { tokenId: string; amount: number; price: number }): Promise<unknown> {
  const client = await getPolymarketClobClient();
  console.log('price', price);
  const order = await client.createMarketOrder(
    {
      side: Side.BUY,
      tokenID: tokenId,
      amount,
      price,
    },
    {
      /**
       * TODO: Docs imply these options are required, but the types are optional
       */
      // tickSize,
      // negRisk
    }
  );

  console.log('Order', JSON.stringify(order, null, 2));

  return await client.postOrder(order, OrderType.FOK);
}

function formatOrderPrice(price: number, minTickSize: number): number {
  return Math.ceil(price / minTickSize) * minTickSize;
}
