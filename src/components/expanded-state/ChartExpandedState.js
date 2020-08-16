import { find } from 'lodash';
import React, { useRef, useState } from 'react';
import { chartExpandedAvailable } from '../../config/experimental';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { useColorForAsset, useUniswapAssetsInWallet } from '../../hooks';
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

export const ChartExpandedStateSheetHeight = chartExpandedAvailable ? 622 : 309;

const ChartExpandedState = ({ asset }) => {
  const chartDateRef = useRef();
  const chartPriceRef = useRef();

  const [chartPrice, setChartPrice] = useState(0);
  const color = useColorForAsset(asset);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const showSwapButton = find(uniswapAssetsInWallet, [
    'uniqueId',
    asset.uniqueId,
  ]);

  return (
    <SlackSheet
      contentHeight={ChartExpandedStateSheetHeight}
      scrollEnabled={false}
    >
      <ChartExpandedStateHeader
        {...asset}
        change={asset?.price?.relative_change_24h || 0}
        chartDateRef={chartDateRef}
        chartPrice={chartPrice}
        chartPriceRef={chartPriceRef}
        color={color}
        latestPrice={asset?.native?.price.display}
      />
      {chartExpandedAvailable && (
        <Chart
          asset={asset}
          chartDateRef={chartDateRef}
          chartPrice={chartPrice}
          chartPriceRef={chartPriceRef}
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
        {showSwapButton && (
          <SwapActionButton color={color} inputType={AssetInputTypes.in} />
        )}
        <SendActionButton color={color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(ChartExpandedState, 'asset');
