import React from 'react';
import styled from 'styled-components/primitives';
import ChartHeaderTitle from './ChartHeaderTitle';
import { ChartYLabel } from '@rainbow-me/animated-charts';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import { fonts } from '@rainbow-me/styles';

const Label = styled(ChartYLabel)`
  font-family: ${fonts.family.SFProRounded};
  font-size: ${fonts.size.big};
  font-weight: ${fonts.weight.heavy};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  width: 100%;
`;

export function formatUSD(value, priceSharedValue) {
  'worklet';
  if (!value) {
    return priceSharedValue?.value || '';
  }
  if (value === 'undefined') {
    return '$0.00';
  }
  const decimals =
    Number(value) < 1
      ? Math.min(
          8,
          value
            .toString()
            .slice(2)
            .slice('')
            .search(/[^0]/g) + 3
        )
      : 2;

  const res = `$${Number(value)
    .toFixed(decimals)
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
