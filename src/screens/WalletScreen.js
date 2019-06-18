import { withSafeTimeout } from '@hocs/safe-timers';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Animated from 'react-native-reanimated';
import { withNavigation, withNavigationFocus } from 'react-navigation';
import {
  compose,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import { AssetList } from '../components/asset-list';
import BlurOverlay from '../components/BlurOverlay';
import { FabWrapper } from '../components/fab';
import { CameraHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Page } from '../components/layout';
import buildWalletSectionsSelector from '../helpers/buildWalletSections';
import { getShowShitcoinsSetting, updateShowShitcoinsSetting } from '../model/localstorage';
import {
  withAccountRefresh,
  withAccountSettings,
  withBlurTransitionProps,
  withFetchingPrices,
  withHideSplashScreen,
  withIsWalletEmpty,
} from '../hoc';
import { position } from '../styles';
import withStatusBarStyle from '../hoc/withStatusBarStyle';

class WalletScreen extends PureComponent {
  static propTypes = {
    allAssetsCount: PropTypes.number,
    assets: PropTypes.array,
    assetsTotal: PropTypes.object,
    blurOpacity: PropTypes.object,
    isEmpty: PropTypes.bool.isRequired,
    isFocused: PropTypes.bool,
    navigation: PropTypes.object,
    onHideSplashScreen: PropTypes.func,
    refreshAccount: PropTypes.func,
    sections: PropTypes.array,
    showBlur: PropTypes.bool,
    toggleShowShitcoins: PropTypes.func,
    uniqueTokens: PropTypes.array,
  }

  scrollViewTracker = new Animated.Value(0)

  componentDidMount = async () => {
    this.props.onHideSplashScreen()
    try {
      const showShitcoins = await getShowShitcoinsSetting();
      if (showShitcoins !== null) {
        this.props.toggleShowShitcoins(showShitcoins);
      }
    } catch (error) {
      // TODO
    }
    setTimeout(() => this.props.onHideSplashScreen(), 1000);
  }

  render = () => {
    const {
      blurOpacity,
      isEmpty,
      navigation,
      refreshAccount,
      sections,
      showBlur,
    } = this.props;

    return (
      <Page style={{ flex: 1, ...position.sizeAsObject('100%') }}>
        {/* Line below appears to be needed for having scrollViewTracker persistent while
        reattaching of react subviews */}
        <Animated.Code
          exec={this.scrollViewTracker}
        />
        <FabWrapper
          sections={sections}
          disabled={isEmpty}
          scrollViewTracker={this.scrollViewTracker}
        >
          <Header justify="space-between">
            <ProfileHeaderButton navigation={navigation} />
            <CameraHeaderButton navigation={navigation} />
          </Header>
          <AssetList
            scrollViewTracker={this.scrollViewTracker}
            fetchData={refreshAccount}
            isEmpty={isEmpty}
            sections={sections}
          />
        </FabWrapper>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
      </Page>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withAccountSettings,
  withFetchingPrices,
  withHideSplashScreen,
  withSafeTimeout,
  withNavigation,
  withNavigationFocus,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withStatusBarStyle('dark-content'),
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        const updatedShowShitcoinsSetting = !showShitcoins;
        toggleShowShitcoins(updatedShowShitcoinsSetting);
        updateShowShitcoinsSetting(updatedShowShitcoinsSetting);
      }
    },
  }),
  withProps(buildWalletSectionsSelector),
)(WalletScreen);
