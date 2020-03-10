import { get, isEmpty, reverse } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { chartExpandedAvailable } from '../../config/experimental';
import { useCharts } from '../../hooks';
import { magicMemo } from '../../utils';
import { BalanceCoinRow } from '../coin-row';
import { ColumnWithDividers } from '../layout';
import {
  SendActionButton,
  SheetActionButtonRow,
  SheetDivider,
  SlackSheet,
  SwapActionButton,
} from '../sheet';
import Chart from '../value-chart/Chart';

const ChartExpandedState = ({ asset }) => {
  const { charts } = useCharts();

  const chart = reverse(get(charts, `${asset.address}`, []));
  const hasChart = chartExpandedAvailable || !isEmpty(chart);
  const change = get(asset, 'price.relative_change_24h', 0);

  return (
    <SlackSheet scrollEnabled={false}>
      <BalanceCoinRow isExpandedState item={asset} />
      <ColumnWithDividers dividerRenderer={SheetDivider}>
        <SheetActionButtonRow>
          <SwapActionButton />
          <SendActionButton />
        </SheetActionButtonRow>
        {hasChart && <Chart change={change} />}
      </ColumnWithDividers>
    </SlackSheet>
  );
};

ChartExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default magicMemo(ChartExpandedState, 'asset');
