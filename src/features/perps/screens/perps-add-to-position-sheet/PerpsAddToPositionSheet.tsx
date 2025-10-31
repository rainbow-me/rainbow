import { memo, useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import Navigation from '@/navigation/Navigation';
import { Box, Separator, Text, TextIcon, useForegroundColor } from '@/design-system';
import { PerpsAccentColorContextProvider } from '@/features/perps/context/PerpsAccentColorContext';
import { PanelSheet } from '@/components/panel-sheet/PanelSheet';
import { PerpBottomSheetHeader } from '@/features/perps/components/PerpBottomSheetHeader';
import { RouteProp, useRoute } from '@react-navigation/native';
import Routes from '@/navigation/routesNames';
import { RootStackParamList } from '@/navigation/types';
import { PerpMarket, PerpsPosition } from '@/features/perps/types';
import { hyperliquidAccountActions, useHyperliquidAccountStore } from '@/features/perps/stores/hyperliquidAccountStore';
import { AmountInputCard } from '@/features/perps/components/AmountInputCard';
import { PerpsSheetActionButtons } from '@/features/perps/components/PerpsSheetActionButtons';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import { ETH_COLOR_DARK, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { formatCurrency } from '@/features/perps/utils/formatCurrency';
import { LiquidationInfo } from '@/features/perps/screens/perps-new-position-screen/LiquidationInfo';
import { useDerivedValue } from 'react-native-reanimated';
import { divWorklet, greaterThanWorklet, mulWorklet, sumWorklet, toFixedWorklet } from '@/safe-math/SafeMath';
import { buildLiquidationInfo } from '@/features/perps/utils/buildLiquidationInfo';
import { buildOrderAmountValidation } from '@/features/perps/utils/buildOrderAmountValidation';
import { useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { getHyperliquidTokenId, parseHyperliquidErrorMessage } from '@/features/perps/utils';
import { analytics } from '@/analytics';
import { logger, RainbowError } from '@/logger';
import * as i18n from '@/languages';
import { divide } from '@/helpers/utilities';

type WeightedEntryPriceParams = {
  addedMargin: string;
  existingEntryPrice: string;
  existingSize: string;
  leverage: number;
  midPrice: string;
};

function calculateWeightedEntryPrice({
  addedMargin,
  existingEntryPrice,
  existingSize,
  leverage,
  midPrice,
}: WeightedEntryPriceParams): string {
  'worklet';

  const hasPrice = Number(midPrice) > 0 && leverage > 0;
  if (!hasPrice) return existingEntryPrice;

  const additionNotional = mulWorklet(addedMargin, leverage);
  if (Number(additionNotional) === 0) return existingEntryPrice;

  const additionSize = divWorklet(additionNotional, midPrice);
  const existingSizeAbs = String(Math.abs(Number(existingSize)));
  const existingNotional = mulWorklet(existingSizeAbs, existingEntryPrice);
  const totalSize = sumWorklet(existingSizeAbs, additionSize);
  if (!Number(totalSize)) return existingEntryPrice;

  const totalNotional = sumWorklet(existingNotional, additionNotional);
  return divWorklet(totalNotional, totalSize);
}

const AddToPositionSheetContent = memo(function AddToPositionSheetContent({
  market,
  position,
}: {
  market: PerpMarket;
  position: PerpsPosition;
}) {
  const { symbol } = market;
  const availableBalance = useHyperliquidAccountStore(state => state.getBalance());
  const defaultAmount = useMemo(() => {
    const halfBalance = divide(availableBalance, 2);
    const initialAmount = greaterThanWorklet(availableBalance, '5') ? halfBalance : availableBalance;
    return toFixedWorklet(initialAmount, 2);
  }, [availableBalance]);

  const [amountToAdd, setAmountToAdd] = useState(defaultAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const leverageSharedValue = useDerivedValue(() => position.leverage);
  const { entryPrice, marginUsed, side, size, leverage } = position;

  const validation = useDerivedValue(() => {
    'worklet';
    return buildOrderAmountValidation({
      amount: amountToAdd,
      availableBalance,
      leverage: leverage,
      marginTiers: market.marginTiers,
    });
  });

  const newTotal = useMemo(() => sumWorklet(marginUsed, amountToAdd), [marginUsed, amountToAdd]);

  const getLiquidationInfo = useMemo(() => {
    return (leverageValue: number, midPrice: string) => {
      'worklet';
      const weightedEntryPrice = calculateWeightedEntryPrice({
        addedMargin: amountToAdd,
        existingEntryPrice: entryPrice,
        existingSize: size,
        leverage: leverageValue,
        midPrice,
      });

      return buildLiquidationInfo({
        amount: newTotal,
        currentPrice: midPrice,
        entryPrice: weightedEntryPrice,
        leverage: leverageValue,
        market,
        positionSide: side,
      });
    };
  }, [entryPrice, market, newTotal, amountToAdd, side, size]);

  const handleCancel = useCallback(() => {
    if (isSubmitting) return;
    Navigation.goBack();
  }, [isSubmitting]);

  const submitOrder = useCallback(async () => {
    if (isSubmitting) return;
    if (Number(amountToAdd) <= 0) return;

    setIsSubmitting(true);

    const perpsBalance = Number(useHyperliquidAccountStore.getState().getValue());
    const tokenId = getHyperliquidTokenId(symbol);
    const liveToken = useLiveTokensStore.getState().tokens[tokenId];
    const livePrice = liveToken?.midPrice ?? liveToken?.price;
    const entryPriceForOrder = livePrice && Number(livePrice) > 0 ? livePrice : market.price;

    try {
      const result = await hyperliquidAccountActions.createIsolatedMarginPosition({
        symbol,
        side,
        leverage: leverage,
        marginAmount: amountToAdd,
        price: entryPriceForOrder,
      });

      if (!result) {
        analytics.track(analytics.event.perpsOpenPositionCanceled, {
          market: symbol,
          side,
          leverage: leverage,
          perpsBalance,
        });
        return;
      }

      const entryPriceNumber = Number(entryPriceForOrder);
      const amountNumber = Number(amountToAdd);
      const positionValue = amountNumber * leverage;
      const positionSize = entryPriceNumber > 0 ? Math.abs(positionValue / entryPriceNumber) : 0;

      analytics.track(analytics.event.perpsAddedToPosition, {
        market: symbol,
        side,
        leverage: leverage,
        perpsBalance,
        positionSize,
        positionValue,
        entryPrice: entryPriceNumber,
      });

      Navigation.goBack();
    } catch (error) {
      const errorMessage = parseHyperliquidErrorMessage(error);
      analytics.track(analytics.event.perpsAddedToPositionFailed, {
        market: symbol,
        side,
        leverage: leverage,
        perpsBalance,
        errorMessage,
      });
      Alert.alert(i18n.t(i18n.l.perps.common.error_submitting_order), errorMessage);
      logger.error(new RainbowError('[PerpsAddToPositionSheet] Failed to add to position', error));
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, leverage, market.price, amountToAdd, side, symbol]);

  return (
    <Box paddingBottom={'20px'} paddingTop={{ custom: 40 }} gap={20}>
      <Box paddingHorizontal={'24px'}>
        <Box gap={28}>
          <PerpBottomSheetHeader title={i18n.t(i18n.l.perps.add_to_position.title)} symbol={symbol} />
          <AmountInputCard
            availableBalance={availableBalance}
            initialAmount={defaultAmount}
            onAmountChange={setAmountToAdd}
            validation={validation}
          />
        </Box>
        <Box gap={20} paddingTop={'20px'}>
          <LiquidationInfo market={market} leverage={leverageSharedValue} getInfo={getLiquidationInfo} />
          <Separator color="separatorTertiary" direction="horizontal" thickness={1} />
          <Box
            flexDirection="row"
            alignItems="center"
            justifyContent="space-between"
            backgroundColor={opacityWorklet(ETH_COLOR_DARK, 0.03)}
            borderWidth={THICK_BORDER_WIDTH}
            borderColor={'buttonStroke'}
            borderRadius={14}
            padding={'12px'}
          >
            <Box flexDirection="row" alignItems="center" gap={12}>
              <TextIcon size="icon 15px" weight="medium" color={'labelSecondary'}>
                {'􁎢'}
              </TextIcon>
              <Text size="17pt" weight="medium" color={'labelSecondary'}>
                {i18n.t(i18n.l.perps.add_to_position.new_total)}
              </Text>
            </Box>
            <Text size="17pt" weight="semibold" color={'labelSecondary'}>
              {formatCurrency(newTotal)}
            </Text>
          </Box>
        </Box>
      </Box>
      <PerpsSheetActionButtons
        onCancel={handleCancel}
        onConfirm={submitOrder}
        isConfirmDisabled={Number(amountToAdd) <= 0 || isSubmitting}
        isConfirming={isSubmitting}
      />
    </Box>
  );
});

export const PerpsAddToPositionSheet = memo(function PerpsAddToPositionSheet() {
  const {
    params: { market, position },
  } = useRoute<RouteProp<RootStackParamList, typeof Routes.PERPS_ADD_TO_POSITION_SHEET>>();
  const separatorSecondaryColor = useForegroundColor('separatorSecondary');

  return (
    <PerpsAccentColorContextProvider>
      <PanelSheet enableKeyboardAvoidance innerBorderWidth={1} innerBorderColor={separatorSecondaryColor}>
        <AddToPositionSheetContent market={market} position={position} />
      </PanelSheet>
    </PerpsAccentColorContextProvider>
  );
});
