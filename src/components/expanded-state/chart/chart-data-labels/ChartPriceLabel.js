import React from 'react';
import styled from 'styled-components/primitives';
import ChartHeaderTitle from './ChartHeaderTitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import { fonts } from '@rainbow-me/styles';
import { ChartYLabel } from 'react-native-animated-charts';

const Label = styled(ChartYLabel)`
  background-color: white;
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.big};
  font-weight: ${fonts.weight.bold};
`;

function formatUSD(value, priceSharedValue) {
  'worklet';
  if (!value) {
    return priceSharedValue.value;
  }
  return `$${Number(value)
    .toFixed(2)
    .toLocaleString('en-US', {
      currency: 'USD',
    })}`;
}

export default function ChartPriceLabel({
  defaultValue,
  isNoPriceData,
  priceSharedValue,
}) {
  return !chartExpandedAvailable || isNoPriceData ? (
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    <Label
      format={value => {
        'worklet';
        return formatUSD(value, priceSharedValue);
      }}
    />
  );
}
