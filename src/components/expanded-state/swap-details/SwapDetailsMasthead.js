import React from 'react';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { Bleed, Box, Columns, Cover, Text } from '@/design-system';
import { useSwapCurrencies } from '@/hooks';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight = CurrencyTileHeight + containerPaddingTop;

const DoubleChevron = () => (
  <Cover alignHorizontal="center" alignVertical="center">
    <RowWithMargins margin={0}>
      <Text color="secondary60 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
        􀯻
      </Text>
      <Bleed left="6px">
        <Text color="secondary40 (Deprecated)" size="16px / 22px (Deprecated)" weight="semibold">
          􀯻
        </Text>
      </Bleed>
    </RowWithMargins>
  </Cover>
);

export default function SwapDetailsMasthead({
  inputAmount,
  inputAmountDisplay,
  inputPriceValue,
  isHighPriceImpact,
  outputAmount,
  outputAmountDisplay,
  outputPriceValue,
  priceImpactColor,
  ...props
}) {
  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  return (
    <Box {...props} alignItems="center" paddingHorizontal="19px (Deprecated)" paddingTop="42px (Deprecated)">
      <Columns space={{ custom: 9 }}>
        <CurrencyTile
          amount={inputAmount}
          amountDisplay={inputAmountDisplay}
          asset={inputCurrency}
          priceValue={inputPriceValue}
          type="input"
        />
        <CurrencyTile
          amount={outputAmount}
          amountDisplay={outputAmountDisplay}
          asset={outputCurrency}
          isHighPriceImpact={isHighPriceImpact}
          priceImpactColor={priceImpactColor}
          priceValue={outputPriceValue}
          style={{ zIndex: -1 }}
          type="output"
        />
      </Columns>

      <Box
        background="body (Deprecated)"
        borderRadius={16}
        height={{ custom: 32 }}
        shadow="21px light (Deprecated)"
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          left: '50%',
          position: 'absolute',
          top: '50%',
          transform: [{ translateX: 3 }, { translateY: 24 }],
        }}
        width={{ custom: 32 }}
      >
        <DoubleChevron />
      </Box>
    </Box>
  );
}
