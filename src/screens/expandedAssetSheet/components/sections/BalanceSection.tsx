import React, { useCallback, useMemo } from 'react';
import * as i18n from '@/languages';
import { Box, Text, TextShadow } from '@/design-system';
import { useExpandedAssetSheetContext } from '../../context/ExpandedAssetSheetContext';
import RainbowCoinIcon from '@/components/coin-icon/RainbowCoinIcon';
import { SheetSeparator } from '../shared/Separator';
import Animated, { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { LAYOUT_ANIMATION } from '../shared/CollapsibleSection';
import { useLiveTokenValue } from '@/components/live-token-text/LiveTokenText';
import { getBalance, TokenData } from '@/state/liveTokens/liveTokensStore';
import { useAccountSettings } from '@/hooks';
import { AnimatedNumber } from '@/components/animated-number/AnimatedNumber';
import { getSolidColorEquivalent } from '@/worklets/colors';
import { useCandlestickStore } from '@/features/charts/stores/candlestickStore';
import { convertAmountToNativeDisplayWorklet } from '@/helpers/utilities';
import { greaterThanWorklet, mulWorklet } from '@/safe-math/SafeMath';
import { useStableValue } from '@/hooks/useStableValue';
import { useListen } from '@/state/internal/hooks/useListen';
import { useChartType } from '@/features/charts/stores/chartsStore';
import { ChartType } from '@/features/charts/types';

export function BalanceSection() {
  const { accentColors, accountAsset: asset, isOwnedAsset } = useExpandedAssetSheetContext();
  const { nativeCurrency } = useAccountSettings();
  const balanceAmount = asset?.balance?.amount ?? '0';
  const tokenId = asset?.uniqueId ?? '';

  const tokenBalanceSelector = useCallback(
    (token: TokenData) => {
      return getBalance({ token, balanceAmount, nativeCurrency });
    },
    [balanceAmount, nativeCurrency]
  );

  const liveTokenBalance = useLiveTokenValue({
    tokenId,
    initialValue: asset?.native?.balance?.display ?? '0',
    initialValueLastUpdated: asset?.price?.changed_at ?? 0,
    selector: tokenBalanceSelector,
  });
  const liveTokenLiquidityCap = useLiveTokenValue({
    tokenId,
    initialValue: '',
    selector: token => token.reliability.metadata.liquidityCap,
  });

  const chartType = useChartType();
  const initialCandlestickPrice = useStableValue(() => useCandlestickStore.getState().getPrice());
  const currentCandlestickPrice = useSharedValue(initialCandlestickPrice);

  useListen(
    useCandlestickStore,
    state => state.getPrice(),
    price => {
      currentCandlestickPrice.value = price;
    },
    (previousPrice, price) => {
      if (!price) return true;
      if (!previousPrice) return false;
      return price.price === previousPrice.price && price.percentChange === previousPrice.percentChange;
    }
  );

  const tokenBalance = useDerivedValue(() => {
    if (chartType === ChartType.Candlestick) {
      const priceToUse = currentCandlestickPrice.value?.price ?? asset?.price?.value;
      if (!priceToUse) {
        return liveTokenBalance;
      }

      const balanceValue = mulWorklet(balanceAmount, priceToUse);

      if (liveTokenLiquidityCap !== '' && greaterThanWorklet(balanceValue, liveTokenLiquidityCap)) {
        return convertAmountToNativeDisplayWorklet(liveTokenLiquidityCap, nativeCurrency);
      }
      return convertAmountToNativeDisplayWorklet(balanceValue, nativeCurrency);
    }

    return liveTokenBalance;
  });

  // TODO: must do this for the `AnimatedNumber` masking to work properly. However, this means this card will be very slightly a different color than the other cards. It's generally imperceptible, but we should use this background color for all the cards
  const backgroundColor = useMemo(
    () => getSolidColorEquivalent({ foreground: accentColors.color, background: accentColors.background, opacity: 0.06 }),
    [accentColors]
  );

  if (!isOwnedAsset || !asset?.balance || !asset?.native?.balance) return null;

  return (
    <Box as={Animated.View} layout={LAYOUT_ANIMATION} gap={28}>
      <Box
        backgroundColor={accentColors.opacity6}
        borderColor={{ custom: accentColors.opacity6 }}
        borderRadius={20}
        borderWidth={1}
        gap={12}
        padding="16px"
      >
        <Box flexDirection="row" justifyContent="space-between">
          <Text color="labelTertiary" size="15pt" weight="bold">
            {i18n.t(i18n.l.expanded_state.asset.balance)}
          </Text>
          <Text color="labelTertiary" size="15pt" weight="bold" align="right">
            {i18n.t(i18n.l.expanded_state.asset.value)}
          </Text>
        </Box>
        <Box alignItems="center" width="full" gap={8} flexDirection="row" justifyContent="flex-start">
          <RainbowCoinIcon
            size={20}
            chainId={asset.chainId}
            color={asset.color}
            icon={asset.icon_url}
            showBadge={false}
            symbol={asset.symbol}
          />
          <TextShadow blur={12} containerStyle={{ flex: 1 }} shadowOpacity={0.24}>
            <Text style={{ flex: 1 }} numberOfLines={1} ellipsizeMode="tail" weight="bold" size="20pt" color={'accent'}>
              {asset.balance.display}
            </Text>
          </TextShadow>
          <AnimatedNumber
            value={tokenBalance}
            easingMaskColor={backgroundColor}
            color="label"
            numberOfLines={1}
            size="20pt"
            weight="heavy"
            align="right"
            tabularNumbers
          />
        </Box>
      </Box>
      <SheetSeparator />
    </Box>
  );
}
