import { get } from 'lodash';
import React from 'react';
import { PixelRatio, Text } from 'react-native';
import styled from 'styled-components/primitives';
import { Row } from '../../../layout';
import ChartHeaderTitle from './ChartHeaderTitle';

import { ChartYLabel } from '@rainbow-me/animated-charts';
import { useAccountSettings } from '@rainbow-me/hooks';
import supportedNativeCurrencies from '@rainbow-me/references/native-currencies.json';
import { colors, fonts, fontWithWidth } from '@rainbow-me/styles';

const Label = styled(ChartYLabel)`
  color: ${colors.black};
  ${fontWithWidth(fonts.weight.heavy)};
  font-size: ${fonts.size.big};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  ${android &&
    `margin-top: -8;
     margin-bottom: -16;`}
`;

const AndroidCurrencySymbolLabel = styled(Label)`
  height: 69;
  left: 5.5;
  margin-right: 3;
  top: ${PixelRatio.get() <= 2.625 ? 10 : 12};
`;

export function formatNative(value, priceSharedValue, nativeSelected) {
  'worklet';
  if (!value) {
    return priceSharedValue?.value || '';
  }
  if (value === 'undefined') {
    return nativeSelected?.alignment === 'left'
      ? `${nativeSelected?.symbol}0.00`
      : `0.00 ${nativeSelected?.symbol}`;
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

  let res = `${Number(value)
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
  return isNoPriceData ? (
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    <Row>
      {android && (
        <AndroidCurrencySymbolLabel
          as={Text}
          defaultValue={nativeSelected?.symbol}
          editable={false}
        >
          {nativeSelected?.symbol}
        </AndroidCurrencySymbolLabel>
      )}
      <Label
        format={value => {
          'worklet';
          const formatted = formatNative(
            value,
            priceSharedValue,
            nativeSelected
          );
          if (android) {
            return formatted.replace(/[^\d.,-]/g, '');
          }
          return formatted;
        }}
        style={{
          width: '100%',
        }}
      />
    </Row>
  );
}
