import React, { useState } from 'react';
import { chartExpandedAvailable } from '../../config/experimental';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { greaterThan } from '../../helpers/utilities';
import { useColorForAsset } from '../../hooks';
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
import { colors } from '@rainbow-me/styles';

const ChartExpandedState = ({ asset }) => {
  const [chartPrice, setChartPrice] = useState(0);

  const color = useColorForAsset(asset);

  const change = asset?.price?.relative_change_24h || 0;
  const isPositiveChange = greaterThan(change, 0);

  return (
    <SlackSheet scrollEnabled={false}>
      <ChartExpandedStateHeader
        {...asset}
        change={change}
        chartPrice={chartPrice}
        color={color}
        isPositiveChange={isPositiveChange}
        latestPrice={asset?.native?.price.display}
      />
      {chartExpandedAvailable && (
        <Chart
          asset={asset}
          chartPrice={chartPrice}
          color={color}
          latestPrice={asset?.native?.price.amount}
          setChartPrice={setChartPrice}
        />
      )}
      <SheetDivider />
      <TokenInfoSection>
        <TokenInfoRow>
          <TokenInfoItem asset={asset} title="Balance">
            <TokenInfoBalanceValue />
          </TokenInfoItem>
          {asset?.native?.price.display && (
            <TokenInfoItem title="Value" weight="bold">
              {asset?.native?.balance.display}
            </TokenInfoItem>
          )}
        </TokenInfoRow>
      </TokenInfoSection>
      <SheetActionButtonRow>
        <SwapActionButton color={color} inputType={AssetInputTypes.in} />
        <SendActionButton color={color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(ChartExpandedState, 'asset');
