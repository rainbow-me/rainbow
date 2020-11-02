import { get } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { useAccountSettings } from '../../../../hooks';
import ChartHeaderTitle from './ChartHeaderTitle';
import supportedNativeCurrencies from '..../../references/native-currencies.json';

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

export function formatNative(value, priceSharedValue, nativeSelected) {
  'worklet';
  if (!value) {
    return priceSharedValue?.value || '';
  }
  if (value === 'undefined') {
    const res =
      nativeSelected?.alignment === 'left'
        ? `${nativeSelected?.symbol}0.00`
        : `0.00 ${nativeSelected?.symbol}`;
    return res;
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

  var res = `${Number(value)
    .toFixed(decimals)
    .toLocaleString('en-US', {
      currency: 'USD',
    })}`;
  res =
    nativeSelected?.alignment === 'left'
      ? `${nativeSelected?.symbol}${res}`
      : `${res} ${nativeSelected?.symbol}`;
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
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
  return !chartExpandedAvailable || isNoPriceData ? (
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    <Label
      format={value => {
        'worklet';
        return formatNative(value, priceSharedValue, nativeSelected);
      }}
    />
  );
}
