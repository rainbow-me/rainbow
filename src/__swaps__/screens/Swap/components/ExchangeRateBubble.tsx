import React from 'react';
import Animated, { useDerivedValue } from 'react-native-reanimated';
import { AnimatedText, Box, Inline, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import { LIGHT_SEPARATOR_COLOR, SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity } from '@/__swaps__/utils/swaps';
import { ButtonPressAnimation } from '@/components/animations';
import { useSwapContext } from '@/__swaps__/screens/Swap/providers/swap-provider';

export const ExchangeRateBubble = () => {
  const { isDarkMode } = useColorMode();
  const { AnimatedSwapStyles, SwapInputController } = useSwapContext();

  const fillTertiary = useForegroundColor('fillTertiary');

  const assetToSellLabel = useDerivedValue(() => {
    if (!SwapInputController?.assetToSell.value) return '';
    return `1 ${SwapInputController?.assetToSell.value?.symbol}`;
  });

  const assetToBuyLabel = useDerivedValue(() => {
    if (!SwapInputController.assetToBuy.value) return '';
    return `1,624.04 ${SwapInputController.assetToBuy.value?.symbol}`;
  });

  // TODO: Do proper exchange rate calculation once we receive the quote

  // TODO: This doesn't work when assets change, figure out why...
  if (!assetToSellLabel.value || !assetToBuyLabel.value) return null;

  return (
    <ButtonPressAnimation scaleTo={0.925} style={{ marginTop: 4 }}>
      <Box
        as={Animated.View}
        alignItems="center"
        justifyContent="center"
        paddingHorizontal="24px"
        paddingVertical="12px"
        style={[AnimatedSwapStyles.hideWhenInputsExpanded, { alignSelf: 'center' }]}
      >
        <Box
          alignItems="center"
          borderRadius={15}
          height={{ custom: 30 }}
          justifyContent="center"
          paddingHorizontal="10px"
          style={{ borderColor: isDarkMode ? SEPARATOR_COLOR : LIGHT_SEPARATOR_COLOR, borderWidth: THICK_BORDER_WIDTH }}
        >
          <Inline alignHorizontal="center" alignVertical="center" space="6px" wrap={false}>
            <AnimatedText
              align="center"
              color="labelQuaternary"
              size="13pt"
              style={{ opacity: isDarkMode ? 0.6 : 0.75 }}
              weight="heavy"
              text={assetToSellLabel}
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
              text={assetToBuyLabel}
            />
          </Inline>
        </Box>
      </Box>
    </ButtonPressAnimation>
  );
};
