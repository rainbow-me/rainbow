import React from 'react';
import { Input } from '../../../inputs';
import ChartHeaderTitle from './ChartHeaderTitle';
import { chartExpandedAvailable } from '@rainbow-me/config/experimental';

export default function ChartPriceLabel({
  defaultValue,
  isNoPriceData,
  priceRef,
  tabularNums,
}) {
  return !chartExpandedAvailable || isNoPriceData ? (
    <ChartHeaderTitle>{defaultValue}</ChartHeaderTitle>
  ) : (
    <ChartHeaderTitle
      as={Input}
      editable={false}
      flex={1}
      ref={priceRef}
      tabularNums={tabularNums}
      width="100%"
    />
  );
}
