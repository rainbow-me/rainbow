import React from 'react';
import { RowWithMargins } from '../../layout';
import CurrencyTile, { CurrencyTileHeight } from './CurrencyTile';
import { Bleed, Box, Cover, Text } from '@rainbow-me/design-system';
import { useSwapCurrencies } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';
import { padding } from '@rainbow-me/styles';

const containerPaddingTop = 34;
export const SwapDetailsMastheadHeight =
  CurrencyTileHeight + containerPaddingTop;

const Container = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 0,
})({
  ...padding.object(containerPaddingTop, 24, 0),
  width: '100%',
});

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
  const { colors, isDarkMode } = useTheme();

  return (
    <Container {...props}>
      <CurrencyTile
        amount={inputAmount}
        amountDisplay={inputAmountDisplay}
        asset={inputCurrency}
        priceValue={inputPriceValue}
        type="input"
      />
      <Bleed shadow="21px heavy" space="15px">
        <Box
          borderRadius={16}
          height={{ custom: 32 }}
          shadow="21px heavy"
          style={{
            alignItems: 'center',
            backgroundColor: isDarkMode ? colors.darkGrey : colors.white,
            justifyContent: 'center',
          }}
          width={{ custom: 32 }}
        >
          <DoubleChevron />
        </Box>
      </Bleed>
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
    </Container>
  );
}
