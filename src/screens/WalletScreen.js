import { withSafeTimeout } from '@hocs/safe-timers';
import { withAccountAssets } from '@rainbow-me/rainbow-common';
import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
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
  withHideSplashScreen,
  withIsWalletEmpty,
  withStatusBarStyle,
} from '../hoc';
import { position } from '../styles';
import { isNewValueForPath } from '../utils';

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
    setSafeTimeout: PropTypes.func,
    showBlur: PropTypes.bool,
    toggleShowShitcoins: PropTypes.func,
    uniqueTokens: PropTypes.array,
  }

  componentDidMount = async () => {
    try {
      const showShitcoins = await getShowShitcoinsSetting();
      if (showShitcoins !== null) {
        this.props.toggleShowShitcoins(showShitcoins);
      }
    } catch (error) {
      // TODO
    }
  }

  shouldComponentUpdate = (nextProps) => {
    const isNewBlurOpacity = isNewValueForPath(this.props, nextProps, 'blurOpacity');
    const isNewCurrency = isNewValueForPath(this.props, nextProps, 'nativeCurrency');
    const isNewFetchingAssets = isNewValueForPath(this.props, nextProps, 'fetchingAssets');
    const isNewFetchingUniqueTokens = isNewValueForPath(this.props, nextProps, 'fetchingUniqueTokens');
    const isNewIsEmpty = isNewValueForPath(this.props, nextProps, 'isEmpty');
    const isNewLanguage = isNewValueForPath(this.props, nextProps, 'language');
    const isNewSections = isNewValueForPath(this.props, nextProps, 'sections');
    const isNewShowBlur = isNewValueForPath(this.props, nextProps, 'showBlur');
    const isNewShowShitcoins = isNewValueForPath(this.props, nextProps, 'showShitcoins');
    const isNewTransitionProps = isNewValueForPath(this.props, nextProps, 'transitionProps');

    if (!nextProps.isFocused && !nextProps.showBlur) {
      return isNewBlurOpacity
        || isNewShowBlur
        || isNewTransitionProps;
    }

    return isNewFetchingAssets
    || isNewFetchingUniqueTokens
    || isNewIsEmpty
    || isNewLanguage
    || isNewCurrency
    || isNewBlurOpacity
    || isNewSections
    || isNewShowShitcoins
    || isNewTransitionProps
    || isNewShowBlur;
  }

  hideSpashScreen = () => {
    const { onHideSplashScreen, setSafeTimeout } = this.props;
    setSafeTimeout(onHideSplashScreen, 150);
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
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          <CameraHeaderButton navigation={navigation} />
        </Header>
        <FabWrapper disabled={isEmpty}>
          <AssetList
            fetchData={refreshAccount}
            isEmpty={isEmpty}
            onLayout={this.hideSpashScreen}
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

        if (updatedShowShitcoinsSetting) {
          analytics.track('Showed shitcoins');
        } else {
          analytics.track('Hid shitcoins');
        }
      }
    },
  }),
  withProps(buildWalletSectionsSelector),
)(WalletScreen);
