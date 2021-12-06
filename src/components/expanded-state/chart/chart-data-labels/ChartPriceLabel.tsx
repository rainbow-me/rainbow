import { get } from 'lodash';
import React from 'react';
import { PixelRatio, Text } from 'react-native';
import styled from 'styled-components';
import { Row } from '../../../layout';
import ChartHeaderTitle from './ChartHeaderTitle';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/animated-charts' o... Remove this comment to see the full error message
import { ChartYLabel } from '@rainbow-me/animated-charts';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/entities' or its c... Remove this comment to see the full error message
import { NativeCurrencyKeys } from '@rainbow-me/entities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountSettings } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { supportedNativeCurrencies } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { fonts, fontWithWidth } from '@rainbow-me/styles';

const ChartPriceRow = styled(Row)``;

const Label = styled(ChartYLabel)`
  color: ${({ theme: { colors } }) => colors.dark};
  ${fontWithWidth(fonts.weight.heavy)};
  font-size: ${fonts.size.big};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android &&
  `margin-top: -30;
     margin-bottom: -30;
     width: 150px;
     `}
`;

const AndroidCurrencySymbolLabel = styled(ChartYLabel)`
  color: ${({ theme: { colors } }) => colors.dark};
  ${fontWithWidth(fonts.weight.heavy)};
  font-size: ${fonts.size.big};
  letter-spacing: ${fonts.letterSpacing.roundedTight};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  ${android &&
  `margin-top: -30;
     margin-bottom: -30;
     `}
  height: 69;
  left: 5.5;
  margin-right: 3;
  top: ${PixelRatio.get() <= 2.625 ? 22 : 23};
`;

export function formatNative(
  value: any,
  priceSharedValue: any,
  nativeSelected: any
) {
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
      ? Math.min(8, value.toString().slice(2).slice('').search(/[^0]/g) + 3)
      : 2;

  // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 2.
  let res = `${Number(value).toFixed(decimals).toLocaleString('en-US', {
    currency: NativeCurrencyKeys.USD,
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
}: any) {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = get(supportedNativeCurrencies, `${nativeCurrency}`);
  return isNoPriceData ? (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ChartPriceRow>
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      {android && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <AndroidCurrencySymbolLabel
          as={Text}
          defaultValue={nativeSelected?.symbol}
          editable={false}
        >
          {nativeSelected?.symbol}
        </AndroidCurrencySymbolLabel>
      )}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Label
        format={(value: any) => {
          'worklet';
          const formatted = formatNative(
            value,
            priceSharedValue,
            nativeSelected
          );
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          if (android) {
            return formatted.replace(/[^\d.,-]/g, '');
          }
          return formatted;
        }}
      />
    </ChartPriceRow>
  );
}
