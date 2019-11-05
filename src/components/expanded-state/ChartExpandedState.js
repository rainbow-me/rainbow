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
  lifecycle,
} from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountData, withAccountSettings } from '../../hoc';
import { ethereumUtils, deviceUtils } from '../../utils';
import ValueChart from '../value-chart/ValueChart';
import { BalanceCoinRow } from '../coin-row';
import BottomSendButtons from '../value-chart/BottomSendButtons';
import { colors, fonts } from '../../styles';
import Divider from '../Divider';
import { Icon } from '../icons';
import SizeToggler from '../animations/SizeToggler';
import { TruncatedText } from '../text';

const HandleIcon = styled(Icon).attrs({
  color: '#C4C6CB',
  name: 'handle',
})`
  margin-top: 12px;
  margin-bottom: 8px;
`;

const ChartContainer = styled.View`
  border-radius: 20;
  align-items: center;
  overflow: hidden;
`;

const BottomContainer = styled.View`
  background-color: ${colors.white};
  width: ${deviceUtils.dimensions.width};
  padding-top: 8px;
  padding-bottom: ${deviceUtils.isTallPhone ? '50px' : '20px'};
`;

const Container = styled.View`
  background-color: ${colors.white};
  width: ${deviceUtils.dimensions.width};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  bottom: 0;
  position: absolute;
  align-items: center;
`;

const LoadingText = styled(TruncatedText)`
  font-size: ${fonts.size.smedium};
  color: ${colors.blueGreyLight};
  font-weight: ${fonts.weight.semibold};
  letter-spacing: 1.3;
  text-align: center;
  background-color: ${colors.white};
  width: ${deviceUtils.dimensions.width};
  margin-top: -25px;
  height: 25px;
`;

const TokenExpandedState = ({
  isOpen,
  onPressSend,
  onPressSwap,
  change,
  changeDirection,
  selectedAsset,
}) => (
  <Container>
    <HandleIcon />
    <SizeToggler startingWidth={120} endingWidth={335} toggle={isOpen}>
      <ChartContainer>
        <ValueChart change={change} changeDirection={changeDirection} />
      </ChartContainer>
    </SizeToggler>
    {!isOpen && <LoadingText>Loading chart...</LoadingText>}
    <Divider />
    <BottomContainer>
      <BalanceCoinRow {...selectedAsset} />
      <BottomSendButtons onPressSend={onPressSend} onPressSwap={onPressSwap} />
    </BottomContainer>
  </Container>
);

TokenExpandedState.propTypes = {
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
  withAccountSettings,
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
  onlyUpdateForKeys(['price', 'subtitle', 'isOpen']),
  lifecycle({
    componentDidMount() {
      setTimeout(() => {
        this.props.onOpen();
      }, 600);
    },
  })
)(TokenExpandedState);
