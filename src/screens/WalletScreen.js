import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Animated from 'react-native-reanimated';
import { withNavigation, withNavigationFocus } from 'react-navigation';
import { compose, withProps } from 'recompact';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import {
  CameraHeaderButton,
  Header,
  ProfileHeaderButton,
} from '../components/header';
import { Page } from '../components/layout';
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

  shouldComponentUpdate = nextProps =>
    !nextProps.isFocused
      ? false
      : isNewValueForObjectPaths(this.props, nextProps, [
          'fetchingAssets',
          'fetchingUniqueTokens',
          'isEmpty',
          'isWalletEthZero',
          'language',
          'nativeCurrency',
          'sections',
        ]);

  render = () => {
    const {
      isEmpty,
      isWalletEthZero,
      navigation,
      refreshAccountData,
      scrollViewTracker,
      sections,
    } = this.props;

    return (
      <Page {...position.sizeAsObject('100%')} flex={1}>
        {/* Line below appears to be needed for having scrollViewTracker persistent while
        reattaching of react subviews */}
        <Animated.Code exec={scrollViewTracker} />
        <FabWrapper
          disabled={isWalletEthZero}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
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
  withNavigationFocus,
  withIsWalletEmpty,
  withIsWalletEthZero,
  withKeyboardHeight,
  withStatusBarStyle('dark-content'),
  withProps(buildWalletSectionsSelector),
  withProps({ scrollViewTracker: new Animated.Value(0) })
)(WalletScreen);
