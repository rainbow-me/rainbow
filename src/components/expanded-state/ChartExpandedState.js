import PropTypes from 'prop-types';
import React from 'react';
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

const ChartExpandedState = ({ asset }) => (
  <SlackSheet scrollEnabled={false}>
    <BalanceCoinRow isExpandedState item={asset} />
    <ColumnWithDividers dividerRenderer={SheetDivider}>
      <SheetActionButtonRow>
        <SwapActionButton />
        <SendActionButton />
      </SheetActionButtonRow>
      <Chart asset={asset} />
    </ColumnWithDividers>
  </SlackSheet>
);

ChartExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default magicMemo(ChartExpandedState, 'asset');
