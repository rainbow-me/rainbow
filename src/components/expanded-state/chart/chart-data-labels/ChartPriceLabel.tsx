import React, { useCallback } from 'react';
import { Text } from '@/design-system';
import { useAccountSettings } from '@/hooks';
import { ChartYLabel } from '@/react-native-animated-charts/src';
import { SupportedCurrency, supportedNativeCurrencies } from '@/references';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { orderOfMagnitudeWorklet, significantDecimalsWorklet } from '@/safe-math/SafeMath';

function calculateDecimalPlaces({
  amount,
  minimumDecimals = 0,
  maximumDecimals = 6,
  precisionAdjustment,
}: {
  amount: number | string;
  minimumDecimals?: number;
  maximumDecimals?: number;
  precisionAdjustment?: number;
}): {
  minimumDecimalPlaces: number;
  maximumDecimalPlaces: number;
} {
  'worklet';
  const orderOfMagnitude = orderOfMagnitudeWorklet(amount);
  const significantDecimals = significantDecimalsWorklet(amount);

  let minimumDecimalPlaces = minimumDecimals;
  let maximumDecimalPlaces = maximumDecimals;

  const minBasedOnOrderOfMag = orderOfMagnitude > 2 ? 0 : 2;
  if (orderOfMagnitude < 1) {
    minimumDecimalPlaces = Math.max(minimumDecimals, significantDecimals);
    maximumDecimalPlaces = Math.max(minBasedOnOrderOfMag, significantDecimals + 1);
  } else {
    minimumDecimalPlaces = minimumDecimals;
    maximumDecimalPlaces = minBasedOnOrderOfMag;
  }

  return {
    minimumDecimalPlaces,
    maximumDecimalPlaces: Math.max(maximumDecimalPlaces + (precisionAdjustment ?? 0), minimumDecimalPlaces),
  };
}

export function formatNative(value: string, defaultPriceValue: string | null, nativeSelected: SupportedCurrency[keyof SupportedCurrency]) {
  'worklet';
  if (!value) {
    return defaultPriceValue || '';
  }
  if (value === 'undefined') {
    return nativeSelected?.alignment === 'left' ? `${nativeSelected?.symbol}0.00` : `0.00 ${nativeSelected?.symbol}`;
  }

  const { maximumDecimalPlaces: numDecimals } = calculateDecimalPlaces({
    amount: value,
    minimumDecimals: 2,
    maximumDecimals: 6,
    precisionAdjustment: 1,
  });

  let res = `${Number(value).toFixed(numDecimals).toLocaleString()}`;
  res = nativeSelected?.alignment === 'left' ? `${nativeSelected?.symbol}${res}` : `${res} ${nativeSelected?.symbol}`;
  const vals = res.split('.');
  if (vals.length === 2) {
    return vals[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + vals[1];
  }
  return res;
}

export default function ChartPriceLabel({
  defaultValue,
  isNoPriceData,
  priceValue,
}: {
  defaultValue: string;
  isNoPriceData: boolean;
  priceValue: string;
}) {
  const { nativeCurrency } = useAccountSettings();
  const nativeSelected = supportedNativeCurrencies?.[nativeCurrency];

  const formatWorklet = useCallback(
    (value: string) => {
      'worklet';
      return formatNative(value, priceValue, nativeSelected);
    },
    [nativeSelected, priceValue]
  );

  return isNoPriceData ? (
    <Text color="label" numberOfLines={1} size="23px / 27px (Deprecated)" weight="bold">
      {defaultValue}
    </Text>
  ) : (
    <ChartYLabel
      formatWorklet={formatWorklet}
      size="23px / 27px (Deprecated)"
      style={{ maxWidth: DEVICE_WIDTH * (2 / 3) }}
      weight="heavy"
    />
  );
}
