import { get, isEmpty, reverse } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { InteractionManager } from 'react-native';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountCharts, withAccountSettings } from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils } from '../../utils';
import Divider from '../Divider';
import { BalanceCoinRow } from '../coin-row';
import { Icon } from '../icons';
import BottomSendButtons from '../value-chart/BottomSendButtons';
import Chart from '../value-chart/Chart';

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  margin-top: 12px;
`;

const ChartContainer = styled.View`
  align-items: center;
  overflow: hidden;
  padding-top: 18px;
  padding-bottom: ${deviceUtils.isTallPhone ? '60px' : '30px'};
`;

const BottomContainer = styled.View`
  background-color: ${colors.white};
  width: ${deviceUtils.dimensions.width};
  padding-top: 8px;
  padding-bottom: 25px;
`;

const Container = styled.View`
  background-color: ${colors.white};
  width: ${deviceUtils.dimensions.width};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  bottom: -200;
  padding-bottom: 200;
  position: absolute;
  align-items: center;
`;

const ChartExpandedState = ({
  change,
  hasChart,
  onPressSend,
  onPressSwap,
  selectedAsset,
}) => {
  return (
    <Container>
      <HandleIcon />
      <BottomContainer>
        <BalanceCoinRow item={selectedAsset} />
        <BottomSendButtons
          onPressSend={onPressSend}
          onPressSwap={onPressSwap}
        />
      </BottomContainer>
      <Divider />
      {hasChart && (
        <ChartContainer>
          <Chart change={change} />
        </ChartContainer>
      )}
    </Container>
  );
};

ChartExpandedState.propTypes = {
  change: PropTypes.number,
  chart: PropTypes.array,
  chartsUpdateChartType: PropTypes.func,
  hasChart: PropTypes.bool,
  onPressSend: PropTypes.func,
  onPressSwap: PropTypes.func,
};

// TODO JIN make this better by just passing in chart
export default compose(
  withAccountCharts,
  withAccountSettings,
  withState('isOpen', 'setIsOpen', false),
  withProps(({ asset, charts }) => {
    const chart = reverse(get(charts, `${asset.address}`, []));
    const hasChart = !isEmpty(chart);
    console.log('selected asset', asset);
    return {
      change: get(asset, 'price.relative_change_24h', 0),
      chart,
      hasChart,
      selectedAsset: asset,
    };
  }),
  withHandlers({
    onPressSend: ({ navigation, asset }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('SendSheet', { asset });
      });
    },
    onPressSwap: ({ navigation, asset }) => () => {
      navigation.goBack();

      InteractionManager.runAfterInteractions(() => {
        navigation.navigate('ExchangeModal', { asset });
      });
    },
  }),
  onlyUpdateForKeys(['fetchingCharts', 'subtitle'])
)(ChartExpandedState);
