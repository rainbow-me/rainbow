import React, { useMemo, useState } from 'react';
import { chartExpandedAvailable } from '../../config/experimental';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { greaterThan } from '../../helpers/utilities';
import { useImageMetadata } from '../../hooks';
import { colors } from '../../styles';
import { magicMemo, pseudoRandomArrayItemFromString } from '../../utils';
import { getUrlForTrustIconFallback } from '../coin-icon';
import {
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import { EmDash } from '../text';
import {
  TokenInfoBalanceValue,
  TokenInfoItem,
  TokenInfoRow,
  TokenInfoSection,
} from '../token-info';
import Chart from '../value-chart/Chart';
import { ChartExpandedStateHeader } from './chart';

function useColorForAsset({ address, color, symbol }) {
  const fallbackUrl = getUrlForTrustIconFallback(address);
  const { color: fallbackColor } = useImageMetadata(fallbackUrl);

  return useMemo(
    () =>
      color ||
      fallbackColor ||
      pseudoRandomArrayItemFromString(symbol, colors.avatarColor),
    [color, fallbackColor, symbol]
  );
}

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
          <TokenInfoItem asset={asset} color={color} title="Balance">
            <TokenInfoBalanceValue />
          </TokenInfoItem>
          <TokenInfoItem title="Value">
            {asset?.native?.balance.display || <EmDash />}
          </TokenInfoItem>
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
