import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/native';
import AssetInputTypes from '../../helpers/assetInputTypes';
import { colors } from '../../styles';
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

const Whitespace = styled.View`
  background-color: ${colors.white};
  flex: 1;
  height: 300;
`;

const ChartExpandedState = ({ asset }) => (
  <SlackSheet scrollEnabled={false}>
    <BalanceCoinRow isExpandedState item={asset} />
    <ColumnWithDividers dividerRenderer={SheetDivider}>
      <SheetActionButtonRow>
        <SwapActionButton inputType={AssetInputTypes.in} />
        <SendActionButton />
      </SheetActionButtonRow>
      <TemporaryChartPlaceholder asset={asset} />
      <Whitespace />
    </ColumnWithDividers>
  </SlackSheet>
);

ChartExpandedState.propTypes = {
  asset: PropTypes.object,
};

export default magicMemo(ChartExpandedState, 'asset');
