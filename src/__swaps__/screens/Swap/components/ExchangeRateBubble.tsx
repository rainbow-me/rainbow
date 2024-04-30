import React, { useMemo, useState } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Box, Inline, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, valueBasedDecimalFormatter } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';
import { useSwapAssets } from '@/state/swaps/assets';
import { ParsedSearchAsset } from '@/__swaps__/types/assets';

type ExchangeRateBubbleInfo = {
  fromAssetText: string;
  toAssetText: string;
};

const getExchangeRateText = ({
  assetToSell,
  assetToBuy,
  assetToSellPrice,
  assetToBuyPrice,
  exchangeRateIndex,
}: {
  assetToSell: ParsedSearchAsset | null;
  assetToBuy: ParsedSearchAsset | null;
  assetToSellPrice: number;
  assetToBuyPrice: number;
  exchangeRateIndex: number;
}): ExchangeRateBubbleInfo => {
  if (!assetToSell || !assetToBuy || !assetToSellPrice || !assetToBuyPrice) {
    return {
      fromAssetText: '',
      toAssetText: '',
    };
  }

  switch (exchangeRateIndex) {
    // 1 assetToSell => x assetToBuy
    default:
    case 0: {
      const formattedRate = valueBasedDecimalFormatter(
        assetToSellPrice / assetToBuyPrice,
        assetToBuyPrice,
        'up',
        -1,
        assetToBuy.type === 'stablecoin' ?? false,
        false
      );

      return {
        fromAssetText: `1 ${assetToSell.symbol}`,
        toAssetText: `${formattedRate} ${assetToBuy.symbol}`,
      };
    }
    // 1 assetToBuy => x assetToSell
    case 1: {
      const formattedRate = valueBasedDecimalFormatter(
        assetToBuyPrice / assetToSellPrice,
        assetToSellPrice,
        'up',
        -1,
        assetToSell.type === 'stablecoin' ?? false,
        false
      );
      return {
        fromAssetText: `1 ${assetToBuy.symbol}`,
        toAssetText: `${formattedRate} ${assetToSell.symbol}`,
      };
    }
    // assetToSell => native currency
    case 2: {
      return {
        fromAssetText: `1 ${assetToSell.symbol}`,
        toAssetText: `$${assetToSellPrice.toLocaleString('en-US', {
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      };
    }
    // assetToBuy => native currency
    case 3: {
      return {
        fromAssetText: `1 ${assetToBuy.symbol}`,
        toAssetText: `$${assetToBuyPrice.toLocaleString('en-US', {
          useGrouping: true,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      };
    }
  }
};

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles } = useSwapContext();
  const [exchangeRateIndex, setExchangeRateIndex] = useState<number>(0);

  const assetToSell = useSwapAssets(state => state.assetToSell);
  const assetToBuy = useSwapAssets(state => state.assetToBuy);
  const assetToSellPrice = useSwapAssets(state => state.assetToSellPrice);
  const assetToBuyPrice = useSwapAssets(state => state.assetToBuyPrice);

  const fillTertiary = useForegroundColor('fillTertiary');

  const { fromAssetText, toAssetText } = useMemo(
    () =>
      getExchangeRateText({
        assetToSell,
        assetToBuy,
        assetToSellPrice,
        assetToBuyPrice,
        exchangeRateIndex,
      }),
    [assetToSell, assetToBuy, assetToSellPrice, assetToBuyPrice, exchangeRateIndex]
  );

  const WrapperStyles = useAnimatedStyle(() => {
    return {
      borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
      borderWidth: THICK_BORDER_WIDTH,
      opacity: fromAssetText && toAssetText ? 1 : 0,
    };
  });

  return (
    <ButtonPressAnimation onPress={() => setExchangeRateIndex((exchangeRateIndex + 1) % 4)} scaleTo={0.925}>
      <Box
        as={Animated.View}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="24px"
        paddingVertical="12px"
        style={[AnimatedSwapStyles.hideWhenInputsExpandedOrPriceImpact, { alignSelf: 'center', position: 'absolute', top: 4 }]}
      >
        <Box
          as={Animated.View}
          alignItems="center"
          borderRadius={15}
          height={{ custom: 30 }}
          justifyContent="center"
          paddingHorizontal="10px"
          style={WrapperStyles}
        >
          <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
            <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {fromAssetText}
            </Text>
            <Box
              borderRadius={10}
              height={{ custom: 20 }}
              paddingTop={{ custom: 0.25 }}
              style={{ backgroundColor: opacity(fillTertiary, 0.04) }}
              width={{ custom: 20 }}
            >
              <TextIcon color="labelQuaternary" containerSize={20} opacity={isDarkMode ? 0.6 : 0.75} size="icon 10px" weight="heavy">
                􀄭
              </TextIcon>
            </Box>
            <Text align="center" color="labelQuaternary" size="13pt" style={{ opacity: isDarkMode ? 0.6 : 0.75 }} weight="heavy">
              {toAssetText}
            </Text>
          </Inline>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
};
