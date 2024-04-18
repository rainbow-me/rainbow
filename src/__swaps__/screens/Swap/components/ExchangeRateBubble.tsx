import React, { useState } from 'react';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, priceForAsset, valueBasedDecimalFormatter } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles, SwapInputController } = useSwapContext();
  const [exchangeRateIndex, setExchangeRateIndex] = useState<number>(0);

  const assetToSellPrice = useSharedValue(0);
  const assetToBuyPrice = useSharedValue(0);
  const assetToSellSymbol = useSharedValue('');
  const assetToBuySymbol = useSharedValue('');
  const fromAssetText = useSharedValue('');
  const toAssetText = useSharedValue('');

  const fillTertiary = useForegroundColor('fillTertiary');

  useAnimatedReaction(
    () => ({
      assetToSell: SwapInputController.assetToSell.value,
      assetToBuy: SwapInputController.assetToBuy.value,
      assetToSellPrice: SwapInputController.assetToSellPrice.value,
      assetToBuyPrice: SwapInputController.assetToBuyPrice.value,
      exchangeRateIndex,
    }),
    (current, previous) => {
      if (current.assetToSell && (!previous?.assetToSell || current.assetToSell !== previous.assetToSell)) {
        assetToSellSymbol.value = current.assetToSell.symbol;

        // try to set price immediately
        const price = priceForAsset({
          asset: current.assetToSell,
          assetType: 'assetToSell',
          assetToSellPrice: SwapInputController.assetToSellPrice,
          assetToBuyPrice: SwapInputController.assetToBuyPrice,
        });

        if (price) {
          assetToSellPrice.value = price;
        }
      }

      if (current.assetToBuy && (!previous?.assetToBuy || current.assetToBuy !== previous.assetToBuy)) {
        assetToBuySymbol.value = current.assetToBuy.symbol;

        // try to set price immediately
        const price = priceForAsset({
          asset: current.assetToBuy,
          assetType: 'assetToBuy',
          assetToSellPrice: SwapInputController.assetToSellPrice,
          assetToBuyPrice: SwapInputController.assetToBuyPrice,
        });

        if (price) {
          assetToBuyPrice.value = price;
        }
      }

      if (current.assetToSell && current.assetToBuy) {
        runOnJS(SwapInputController.fetchAssetPrices)({
          assetToSell: current.assetToSell,
          assetToBuy: current.assetToBuy,
        });
      }

      if (current.assetToSellPrice && (!previous?.assetToSellPrice || current.assetToSellPrice !== previous.assetToSellPrice)) {
        assetToSellPrice.value = current.assetToSellPrice;
      }

      if (current.assetToBuyPrice && (!previous?.assetToBuyPrice || current.assetToBuyPrice !== previous.assetToBuyPrice)) {
        assetToBuyPrice.value = current.assetToBuyPrice;
      }

      if (assetToSellPrice.value && assetToBuyPrice.value) {
        switch (exchangeRateIndex) {
          // 1 assetToSell => x assetToBuy
          case 0: {
            const formattedRate = valueBasedDecimalFormatter(
              assetToSellPrice.value / assetToBuyPrice.value,
              assetToBuyPrice.value,
              'up',
              -1,
              current.assetToBuy?.type === 'stablecoin' ?? false,
              false
            );

            fromAssetText.value = `1 ${assetToSellSymbol.value}`;
            toAssetText.value = `${formattedRate} ${assetToBuySymbol.value}`;
            break;
          }
          // 1 assetToBuy => x assetToSell
          case 1: {
            const formattedRate = valueBasedDecimalFormatter(
              assetToBuyPrice.value / assetToSellPrice.value,
              assetToSellPrice.value,
              'up',
              -1,
              current.assetToSell?.type === 'stablecoin' ?? false,
              false
            );
            fromAssetText.value = `1 ${assetToBuySymbol.value}`;
            toAssetText.value = `${formattedRate} ${assetToSellSymbol.value}`;
            break;
          }
          // assetToSell => native currency
          case 2: {
            fromAssetText.value = `1 ${assetToSellSymbol.value}`;
            toAssetText.value = `$${assetToSellPrice.value.toLocaleString('en-US', {
              useGrouping: true,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            break;
          }
          // assetToBuy => native currency
          case 3: {
            fromAssetText.value = `1 ${assetToBuySymbol.value}`;
            toAssetText.value = `$${assetToBuyPrice.value.toLocaleString('en-US', {
              useGrouping: true,
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`;
            break;
          }
        }
      }
    }
  );

  const WrapperStyles = useAnimatedStyle(() => {
    return {
      borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR,
      borderWidth: THICK_BORDER_WIDTH,
      opacity: fromAssetText.value && toAssetText.value ? 1 : 0,
    };
  });

  return (
    <ButtonPressAnimation onPress={() => setExchangeRateIndex((exchangeRateIndex + 1) % 4)} scaleTo={0.925} style={{ marginTop: 4 }}>
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
            <AnimatedText
              align="center"
              color="labelQuaternary"
              size="13pt"
              style={{ opacity: isDarkMode ? 0.6 : 0.75 }}
              weight="heavy"
              text={fromAssetText}
            />
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
            <AnimatedText
              align="center"
              color="labelQuaternary"
              size="13pt"
              style={{ opacity: isDarkMode ? 0.6 : 0.75 }}
              weight="heavy"
              text={toAssetText}
            />
          </Inline>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
};
