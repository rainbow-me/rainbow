import PropTypes from 'prop-types';
import React, { Component, createElement } from 'react';
import { StatusBar } from 'react-native';
import {
  AddContactState,
  InvestmentExpandedState,
  SwapDetailsState,
  TokenExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { padding } from '../styles';
import { deviceUtils, safeAreaInsetValues } from '../utils';

const { bottom: safeAreaBottom, top: safeAreaTop } = safeAreaInsetValues;

const ScreenTypes = {
  contact: AddContactState,
  swap_details: SwapDetailsState,
  token: TokenExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
};

export default class ExpandedAssetScreen extends Component {
  static propTypes = {
    address: PropTypes.string,
    asset: PropTypes.object,
    containerPadding: PropTypes.number.isRequired,
    onCloseModal: PropTypes.func,
    onPressBackground: PropTypes.func,
    panelWidth: PropTypes.number,
    type: PropTypes.oneOf(Object.keys(ScreenTypes)).isRequired,
  };

  static defaultProps = {
    containerPadding: 15,
  };

  shouldComponentUpdate = () => false;

  render = () => (
    <Centered
      {...deviceUtils.dimensions}
      css={padding(
        safeAreaTop,
        this.props.containerPadding,
        safeAreaBottom || safeAreaTop
      )}
      direction="column"
    >
      <StatusBar barStyle="light-content" />
      <TouchableBackdrop onPress={this.props.onPressBackground} />
      {createElement(ScreenTypes[this.props.type], {
        ...this.props,
      })}
    </Centered>
  );
}
