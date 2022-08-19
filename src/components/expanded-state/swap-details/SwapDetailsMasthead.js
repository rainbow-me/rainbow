import React from 'react';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { Bleed, Box, Columns, Cover, Text } from '@/design-system';
import { useSwapCurrencies } from '@rainbow-me/hooks';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const DoubleChevron = () => (
  <Cover alignHorizontal="center" alignVertical="center">
    <RowWithMargins>
      <Text color="secondary60" weight="semibold">
        􀯻
      </Text>
      <Bleed left="6px">
        <Text color="secondary40" weight="semibold">
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
    <Box
      {...props}
      alignItems="center"
      paddingHorizontal="19px"
      paddingTop="42px"
    >
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
        background="body"
        borderRadius={16}
        height={{ custom: 32 }}
        shadow="21px light"
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
