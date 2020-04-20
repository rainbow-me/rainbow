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

const ChartExpandedState = ({ onPressSend, onPressSwap, selectedAsset }) => {
  return (
    <Container>
      <HandleIcon />
      <BottomContainer>
        <BalanceCoinRow {...selectedAsset} />
        <BottomSendButtons
          onPressSend={onPressSend}
          onPressSwap={onPressSwap}
        />
      </BottomContainer>
      <Divider />
      <ChartContainer>
        <Chart />
      </ChartContainer>
    </Container>
  );
};

ChartExpandedState.propTypes = {
  asset: PropTypes.object,
  change: PropTypes.string,
  changeDirection: PropTypes.bool,
  chart: PropTypes.array,
  chartsUpdateChartType: PropTypes.func,
  fetchingCharts: PropTypes.bool,
  hasChart: PropTypes.bool,
  isLoading: PropTypes.bool,
  nativeCurrency: PropTypes.string,
  onPressSend: PropTypes.func,
  onPressSwap: PropTypes.func,
  price: PropTypes.string,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

// TODO JIN make this better by just passing in chart
export default compose(
  withAccountCharts,
  withAccountSettings,
  withState('isOpen', 'setIsOpen', false),
  withProps(({ asset, charts, fetchingCharts }) => {
    const chart = reverse(get(charts, `${asset.address}`, []));
    const hasChart = !isEmpty(chart);
    return {
      change: get(asset, 'native.change', '-'),
      changeDirection: get(asset, 'price.relative_change_24h', 0) > 0,
      chart,
      hasChart,
      isLoading: !hasChart && fetchingCharts,
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
  onlyUpdateForKeys(['fetchingCharts', 'price', 'subtitle'])
)(ChartExpandedState);
