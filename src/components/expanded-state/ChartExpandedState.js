import { get, isEmpty, reverse } from 'lodash';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { InteractionManager } from 'react-native';
import styled from 'styled-components/primitives';
import { chartExpandedAvailable } from '../../config/experimental';
import { useCharts } from '../../hooks';
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

const ChartExpandedState = ({ asset, navigation }) => {
  const { charts } = useCharts();

  const chart = reverse(get(charts, `${asset.address}`, []));
  const hasChart = chartExpandedAvailable || !isEmpty(chart);
  const change = get(asset, 'price.relative_change_24h', 0);

  const onPressSend = useCallback(() => {
    navigation.goBack();

    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('SendSheet', { asset });
    });
  }, [asset, navigation]);

  const onPressSwap = useCallback(() => {
    navigation.goBack();

    InteractionManager.runAfterInteractions(() => {
      navigation.navigate('ExchangeModal', { asset });
    });
  }, [asset, navigation]);

  return (
    <Container>
      <HandleIcon />
      <BottomContainer>
        <BalanceCoinRow item={asset} />
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
  asset: PropTypes.object,
  navigation: PropTypes.object,
};

export default ChartExpandedState;
