import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import TouchableBackdrop from '../components/TouchableBackdrop';
import {
  AddContactState,
  ChartExpandedState,
  InvestmentExpandedState,
  SupportedCountriesExpandedState,
  SwapDetailsState,
  TokenExpandedState,
  UniqueTokenExpandedState,
  WalletProfileCreator,
} from '../components/expanded-state';
import { Centered } from '../components/layout';
import { useDimensions } from '../hooks';
import { padding } from '../styles';

const ScreenTypes = {
  chart: ChartExpandedState,
  contact: AddContactState,
  supported_countries: SupportedCountriesExpandedState,
  swap_details: SwapDetailsState,
  token: TokenExpandedState,
  unique_token: UniqueTokenExpandedState,
  uniswap: InvestmentExpandedState,
  wallet_profile_creator: WalletProfileCreator,
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
