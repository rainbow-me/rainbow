import PropTypes from 'prop-types';
import React from 'react';
import AssetInputTypes from '../../helpers/assetInputTypes';
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
// import Chart from '../value-chart/Chart';
import TemporaryChartPlaceholder from '../value-chart/TemporaryChartPlaceholder';

const ChartExpandedState = ({ asset }) => (
  <SlackSheet scrollEnabled={false}>
    <BalanceCoinRow isExpandedState item={asset} />
    <ColumnWithDividers dividerRenderer={SheetDivider}>
      <SheetActionButtonRow>
        <SwapActionButton inputType={AssetInputTypes.in} />
        <SendActionButton />
      </SheetActionButtonRow>
      <TemporaryChartPlaceholder asset={asset} />
    </ColumnWithDividers>
  </SlackSheet>
);

ChartExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default magicMemo(ChartExpandedState, 'asset');
