import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import {
  AddContactState,
  ChartExpandedState,
  InvestmentExpandedState,
  SwapDetailsState,
  TokenExpandedState,
  UniqueTokenExpandedState,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import TouchableBackdrop from '../components/TouchableBackdrop';
import { useDimensions } from '../hooks';
import { padding } from '../styles';

const ScreenTypes = {
  chart: ChartExpandedState,
  contact: AddContactState,
  swap_details: SwapDetailsState,
  token: TokenExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
};

const ExpandedAssetScreen = ({
  containerPadding,
  onPressBackground,
  type,
  ...props
}) => {
  const { height, width } = useDimensions();
  const { bottom, top } = useSafeArea();

  return (
    <Centered
      {...{ height, width }}
      css={padding(top, containerPadding, bottom || top)}
      direction="column"
    >
      <StatusBar barStyle="light-content" />
      <TouchableBackdrop onPress={onPressBackground} />
      {createElement(ScreenTypes[type], props)}
    </Centered>
  );
};

ExpandedAssetScreen.propTypes = {
  containerPadding: PropTypes.number.isRequired,
  onPressBackground: PropTypes.func,
  type: PropTypes.oneOf(Object.keys(ScreenTypes)).isRequired,
};

ExpandedAssetScreen.defaultProps = {
  containerPadding: 15,
};

export default ExpandedAssetScreen;
