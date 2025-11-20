import { memo, useCallback } from 'react';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, Text, useForegroundColor } from '@/design-system';
import { PanelSheet } from '@/components/PanelSheet/PanelSheet';
import { PolymarketPositionCard } from '@/features/polymarket/components/PolymarketPositionCard';
import { HoldToActivateButton } from '@/components/hold-to-activate-button/HoldToActivateButton';
import { truncateToDecimals } from '@/safe-math/SafeMath';
import { usePolymarketPositionsStore } from '@/features/polymarket/stores/polymarketPositionsStore';
import { getPolymarketClobClient } from '@/features/polymarket/stores/derived/usePolymarketClobClient';
import { Side, OrderType, TickSize } from '@polymarket/clob-client';
import { ensureError, logger, RainbowError } from '@/logger';
import { PolymarketPosition } from '@/features/polymarket/types';

export const PolymarketManagePositionSheet = memo(function PolymarketManagePositionSheet() {
  const {
    params: { position: initialPosition },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MANAGE_POSITION_SHEET>>();

  const position = usePolymarketPositionsStore(state => state.getPosition(initialPosition.conditionId) ?? initialPosition);

  const separatorSecondaryColor = useForegroundColor('separatorSecondary');
  const red = useForegroundColor('red');
  const green = useForegroundColor('green');

  const handleMarketSellTotalPosition = useCallback(async () => {
    try {
      // TODO: replace position.curPrice with latest price from live pricing store
      const result = await marketSellTotalPosition({ position, latestPrice: position.curPrice });
      console.log('Order result', JSON.stringify(result, null, 2));
    } catch (e) {
      const error = ensureError(e);
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error selling position', error), {
        message: error.message,
      });
      // TODO: Show error to user
    }
  }, [position]);

  const pnlColor = Number(position.cashPnl) >= 0 ? green : red;
  const pnlSign = Number(position.cashPnl) >= 0 ? '+' : '-';
  const absPnl = Math.abs(Number(position.cashPnl));

  return (
    <PanelSheet innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
      <Box paddingHorizontal="24px" paddingBottom={'24px'}>
        <Box alignItems="center" gap={18} paddingTop={{ custom: 71 }} paddingBottom={{ custom: 78 }}>
          <Text size="20pt" weight="heavy" color="labelTertiary">
            {'Position Value'}
          </Text>
          <Text size="44pt" weight="heavy" color="label">
            {truncateToDecimals(String(position.currentValue), 2)}
          </Text>
          <Text size="20pt" weight="bold" color={{ custom: pnlColor }}>
            {pnlSign} ${truncateToDecimals(String(absPnl), 2)}
          </Text>
        </Box>
        <Box gap={24}>
          <PolymarketPositionCard position={position} showActionButton={false} />
          <HoldToActivateButton
            backgroundColor="blue"
            disabledBackgroundColor={'gray'}
            label="Hold to Cash Out"
            processingLabel="Cashing Out..."
            isProcessing={false}
            onLongPress={handleMarketSellTotalPosition}
            showBiometryIcon={false}
          />
        </Box>
      </Box>
    </PanelSheet>
  );
});

async function marketSellTotalPosition({ position, latestPrice }: { position: PolymarketPosition; latestPrice: number }): Promise<unknown> {
  const client = await getPolymarketClobClient();
  const order = await client.createMarketOrder(
    {
      side: Side.SELL,
      tokenID: position.asset,
      amount: position.size,
      price: latestPrice,
    },
    {
      /**
       * TODO: Docs imply these options are required, but the types are optional
       */
      tickSize: String(position.market.orderPriceMinTickSize) as TickSize,
      negRisk: position.negativeRisk,
    }
  );

  return await client.postOrder(order, OrderType.FOK);
}
