import React, { useState } from 'react';
import { chartExpandedAvailable } from '../../config/experimental';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { greaterThan } from '../../helpers/utilities';
import { magicMemo } from '../../utils';
import {
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import Chart from '../value-chart/Chart';
import { ChartExpandedStateHeader } from './chart';

const ChartExpandedState = ({ asset }) => {
  const [chartPrice, setChartPrice] = useState(0);

  const change = asset?.price?.relative_change_24h || 0;
  const isPositiveChange = greaterThan(change, 0);

  return (
    <SlackSheet scrollEnabled={false}>
      <ChartExpandedStateHeader
        {...asset}
        change={change}
        chartPrice={chartPrice}
        isPositiveChange={isPositiveChange}
        latestPrice={asset?.native?.price.display}
      />
      {chartExpandedAvailable && (
        <Chart
          asset={asset}
          chartPrice={chartPrice}
          latestPrice={asset?.native?.price.amount}
          setChartPrice={setChartPrice}
        />
      )}
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          <TokenInfoItem asset={asset} title="Balance">
            <TokenInfoBalanceValue {...asset} />
          </TokenInfoItem>
          <TokenInfoItem title="Value">
            {asset?.native?.balance.display}
          </TokenInfoItem>
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <SwapActionButton color={asset?.color} inputType={AssetInputTypes.in} />
        <SendActionButton color={asset?.color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(ChartExpandedState, 'asset');
