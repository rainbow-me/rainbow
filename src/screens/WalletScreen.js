import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { compose, withProps } from 'recompact';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import {
  CameraHeaderButton,
  Header,
  ProfileHeaderButton,
} from '../components/header';
import { Page } from '../components/layout';
import ExchangeFab from '../components/fab/ExchangeFab';
import SendFab from '../components/fab/SendFab';
import buildWalletSectionsSelector from '../helpers/buildWalletSections';
import {
  withAccountData,
  withAccountSettings,
  withDataInit,
  withIsWalletEmpty,
  withIsWalletEthZero,
  withStatusBarStyle,
  withUniqueTokens,
  withUniswapLiquidityTokenInfo,
  withKeyboardHeight,
} from '../hoc';
import { position } from '../styles';
import { isNewValueForObjectPaths } from '../utils';
import { getKeyboardHeight } from '../handlers/localstorage/globalSettings';
import networkInfo from '../helpers/networkInfo';

class WalletScreen extends Component {
  static propTypes = {
    accountAddress: PropTypes.string,
    allAssetsCount: PropTypes.number,
    assets: PropTypes.array,
    assetsTotal: PropTypes.object,
    initializeWallet: PropTypes.func,
    isEmpty: PropTypes.bool.isRequired,
    isFocused: PropTypes.bool,
    isWalletEthZero: PropTypes.bool.isRequired,
    navigation: PropTypes.object,
    network: PropTypes.string,
    refreshAccountData: PropTypes.func,
    scrollViewTracker: PropTypes.object,
    sections: PropTypes.array,
    setKeyboardHeight: PropTypes.func,
    setSafeTimeout: PropTypes.func,
    uniqueTokens: PropTypes.array,
  };

  state = {
    isFocused: true,
  };

  static getDerivedStateFromProps(props, state) {
    const isFocused = props.navigation.isFocused();
    return { ...state, isFocused };
  }

  componentDidMount = async () => {
    try {
      await this.props.initializeWallet();
      const keyboardheight = await getKeyboardHeight();

      if (keyboardheight) {
        this.props.setKeyboardHeight(keyboardheight);
      }
    } catch (error) {
      // TODO error state
    }
  };

  shouldComponentUpdate = (nextProps, nextState) => {
    const isFocused = this.state.isFocused;
    const willBeFocused = nextState.isFocused;

    const sectionLengthHasChanged =
      this.props.sections.length !== nextProps.sections.length;

    return (
      // We need it when coming back from settings
      (!isFocused && willBeFocused) ||
      // We need it when switching accounts or network
      sectionLengthHasChanged ||
      // We need it when loading assets or empty wallet
      isNewValueForObjectPaths(this.props, nextProps, [
        'network',
        'loadingAssets',
        'fetchingUniqueTokens',
        'isEmpty',
        'isWalletEthZero',
      ]) ||
      // We need it to update prices / balances (only when focused!)
      (willBeFocused &&
        isNewValueForObjectPaths(this.props, nextProps, ['sections']))
    );
  };

  render = () => {
    const {
      isEmpty,
      isWalletEthZero,
      navigation,
      network,
      refreshAccountData,
      scrollViewTracker,
      sections,
    } = this.props;

    // Show the exchange fab only for supported networks
    // (mainnet & rinkeby)
    const fabs = get(networkInfo[network], 'exchange_enabled')
      ? [ExchangeFab, SendFab]
      : [SendFab];

    return (
      <Page {...position.sizeAsObject('100%')} flex={1}>
        {/* Line below appears to be needed for having scrollViewTracker persistent while
        reattaching of react subviews */}
        <Animated.Code exec={scrollViewTracker} />
        <FabWrapper
          disabled={isWalletEthZero}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
          network={network}
          fabs={fabs}
        >
          <Header marginTop={5} justify="space-between">
            <ProfileHeaderButton navigation={navigation} />
            <CameraHeaderButton navigation={navigation} />
          </Header>
          <AssetList
            fetchData={refreshAccountData}
            isEmpty={isEmpty}
            isWalletEthZero={isWalletEthZero}
            scrollViewTracker={scrollViewTracker}
            sections={sections}
            network={network}
          />
        </FabWrapper>
      </Page>
    );
  };
}

export default compose(
  withAccountData,
  withUniqueTokens,
  withAccountSettings,
  withDataInit,
  withUniswapLiquidityTokenInfo,
  withSafeTimeout,
  withNavigation,
  withIsWalletEmpty,
  withIsWalletEthZero,
  withKeyboardHeight,
  withStatusBarStyle('dark-content'),
  withProps(buildWalletSectionsSelector),
  withProps({ scrollViewTracker: new Animated.Value(0) })
)(WalletScreen);
