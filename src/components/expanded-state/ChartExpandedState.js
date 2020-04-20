import { get } from 'lodash';
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
import { withAccountData } from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils, ethereumUtils } from '../../utils';
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
  change: PropTypes.string,
  changeDirection: PropTypes.bool,
  isOpen: PropTypes.bool,
  onPressSend: PropTypes.func,
  onPressSwap: PropTypes.func,
  price: PropTypes.string,
  selectedAsset: PropTypes.object,
  subtitle: PropTypes.string,
  title: PropTypes.string,
};

export default compose(
  withAccountData,
  withState('isOpen', 'setIsOpen', false),
  withProps(({ asset: { address, ...asset }, assets }) => {
    let selectedAsset = ethereumUtils.getAsset(assets, address);
    if (!selectedAsset) {
      selectedAsset = asset;
    }
    return {
      change: get(selectedAsset, 'native.change', '-'),
      changeDirection: get(selectedAsset, 'price.relative_change_24h', 0) > 0,
      selectedAsset,
    };
  }),
  withHandlers({
    onOpen: ({ setIsOpen }) => () => {
      setIsOpen(true);
    },
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
  onlyUpdateForKeys(['price', 'subtitle'])
)(ChartExpandedState);
