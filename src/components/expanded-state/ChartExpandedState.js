import React, { useState } from 'react';
import styled from 'styled-components/primitives';
import { chartExpandedAvailable } from '../../config/experimental';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { greaterThan } from '../../helpers/utilities';
import { colors, padding } from '../../styles';
import { magicMemo } from '../../utils';
import { CoinIcon } from '../coin-icon';
import { ColumnWithMargins, Row, RowWithMargins } from '../layout';
import {
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import { Text, TruncatedText } from '../text';
import Chart from '../value-chart/Chart';
import { ChartExpandedStateHeader } from './chart';

const TokenInfoHeading = styled(Text).attrs({
  letterSpacing: 'roundedMedium',
  opacity: 0.5,
  size: 'smedium',
  weight: 'semibold',
})``;

const TokenInfoValue = styled(TruncatedText).attrs(
  ({ color = colors.dark }) => ({
    color,
    size: 'larger',
    weight: 'semibold',
  })
)``;

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
      <Row align="center" css={padding(24, 19, 7)} justify="space-between">
        <ColumnWithMargins margin={5}>
          <TokenInfoHeading>Balance</TokenInfoHeading>
          <RowWithMargins align="center" margin={5}>
            <CoinIcon {...asset} size={20} />
            <TokenInfoValue color={asset?.color}>
              {asset?.balance?.display}
            </TokenInfoValue>
          </RowWithMargins>
        </ColumnWithMargins>
        <ColumnWithMargins justify="end" margin={5}>
          <TokenInfoHeading align="right">Value</TokenInfoHeading>
          <TokenInfoValue align="right">
            {asset?.native?.balance.display}
          </TokenInfoValue>
        </ColumnWithMargins>
      </Row>
      <SheetActionButtonRow>
        <SwapActionButton color={asset?.color} inputType={AssetInputTypes.in} />
        <SendActionButton color={asset?.color} />
      </SheetActionButtonRow>
    </SlackSheet>
  );
};

export default magicMemo(ChartExpandedState, 'asset');
