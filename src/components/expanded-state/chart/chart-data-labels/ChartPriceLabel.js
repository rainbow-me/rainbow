import React from 'react';
import { Input } from '../../../inputs';
import ChartHeaderTitle from './ChartHeaderTitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';
import { ChartYLabel } from 'react-native-animated-charts';

function formatUSD(value, priceSharedValue) {
  'worklet';
  if (value === '') {
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
  priceRef,
  tabularNums,
  priceSharedValue,
}) {
  return !chartExpandedAvailable || isNoPriceData ? (
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    <>
      <ChartHeaderTitle
        as={Input}
        editable={false}
        flex={1}
        ref={priceRef}
        tabularNums={tabularNums}
        width="100%"
      />
      <ChartYLabel
        ChartYLabel
        format={value => {
          'worklet';
          return formatUSD(value, priceSharedValue);
        }}
        style={{ backgroundColor: 'white', margin: 4 }}
      />
    </>
  );
}
