import { memo, useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import Routes from '@/navigation/routesNames';
import { Box, Text, useColorMode, useForegroundColor } from '@/design-system';
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
import { mulWorklet, subWorklet } from '@/safe-math/SafeMath';
import { marketSellTotalPosition } from '@/features/polymarket/utils/orders';
import { collectTradeFee } from '@/features/polymarket/utils/collectTradeFee';
import { getPositionAction, PositionAction } from '@/features/polymarket/utils/getPositionAction';
import Navigation from '@/navigation/Navigation';
import { refetchPolymarketStores } from '@/features/polymarket/utils/refetchPolymarketStores';
import { redeemPosition } from '@/features/polymarket/utils/redeemPosition';
import { polymarketClobDataClient } from '@/features/polymarket/polymarket-clob-data-client';
import { getPositionTokenId } from '@/features/polymarket/utils/getPositionTokenId';

export const PolymarketManagePositionSheet = memo(function PolymarketManagePositionSheet() {
  const {
    params: { position: initialPosition },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.POLYMARKET_MANAGE_POSITION_SHEET>>();

  const position = usePolymarketPositionsStore(state => state.getPosition(initialPosition.conditionId) ?? initialPosition);
  const [isProcessing, setIsProcessing] = useState(false);

  const { isDarkMode } = useColorMode();
  const accentColor = position.market.color;
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
        return 'Hold to Claim';
      case PositionAction.BURN:
        return 'Hold to Burn';
      case PositionAction.CASH_OUT:
        return 'Hold to Cash Out';
    }
  }, [actionButtonType]);

  const actionButtonLoadingLabel = useMemo(() => {
    switch (actionButtonType) {
      case PositionAction.CLAIM:
        return 'Claiming...';
      case PositionAction.BURN:
        return 'Burning...';
      case PositionAction.CASH_OUT:
        return 'Cashing Out...';
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
      collectTradeFee(tokensSold);
      refetchPolymarketStores();
      Navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error selling position', ensureError(e)));
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to cash out position. Please try again.');
    }
  }, [position]);

  const handleClaimPosition = useCallback(async () => {
    try {
      await redeemPosition(position);
      refetchPolymarketStores();
      Navigation.goBack();
    } catch (e) {
      logger.error(new RainbowError('[PolymarketManagePositionSheet] Error claiming position', ensureError(e)));
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to claim position. Please try again.');
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

  return (
    <PanelSheet innerBorderWidth={1} panelStyle={{ backgroundColor: isDarkMode ? '#000000' : '#FFFFFF' }}>
      <LinearGradient
        colors={[opacityWorklet(accentColor, 0.22), opacityWorklet(accentColor, 0)]}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <Box paddingHorizontal="24px" paddingBottom={'24px'}>
        <Box alignItems="center" gap={18} paddingTop={{ custom: 71 }} paddingBottom={{ custom: 78 }}>
          <Text size="20pt" weight="heavy" color="labelTertiary">
            {'Position Value'}
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
            disabledBackgroundColor={'gray'}
            label={actionButtonLabel}
            processingLabel={actionButtonLoadingLabel}
            isProcessing={isProcessing}
            onLongPress={onPressActionButton}
            showBiometryIcon={false}
          />
        </Box>
      </Box>
    </PanelSheet>
  );
});
