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
  letter-spacing: ${fonts.letterSpacing.roundedTight};
`;

function formatUSD(value, priceSharedValue) {
  'worklet';
  if (!value) {
    return priceSharedValue.value;
  }
  const res = `$${Number(value)
    .toFixed(2)
    .toLocaleString('en-US', {
      currency: 'USD',
    })}`;
  const vals = res.split('.');
  if (vals.length === 2) {
    return vals[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + vals[1];
  }
  return res;
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
