import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { StatusBar } from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useNavigation, useNavigationParam } from 'react-navigation-hooks';
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

const ExpandedAssetScreen = ({ containerPadding, ...props }) => {
  const { height, width } = useDimensions();
  const { top } = useSafeArea();

  const {
    goBack,
    state: { params },
  } = useNavigation();
  const type = useNavigationParam('type');

  // return createElement(ScreenTypes[type], {
  //       ...params,
  //       ...props,
  //       panelWidth: width - containerPadding * 2,
  //     });

  return (
    <Centered
      {...{ height, width }}
      css={padding(top, containerPadding, 0)}
      direction="column"
    >
      <StatusBar barStyle="light-content" />
      {ScreenTypes[type] !== ScreenTypes.chart &&
        ScreenTypes[type] !== ScreenTypes.unique_token && (
          <TouchableBackdrop onPress={goBack} />
        )}
      {createElement(ScreenTypes[type], {
        ...params,
        ...props,
        panelWidth: width - containerPadding * 2,
      })}
    </Centered>
  );
};

ExpandedAssetScreen.propTypes = {
  containerPadding: PropTypes.number.isRequired,
};

ExpandedAssetScreen.defaultProps = {
  containerPadding: 15,
};

export default ExpandedAssetScreen;
