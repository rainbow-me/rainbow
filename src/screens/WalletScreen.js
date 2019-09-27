import { withSafeTimeout } from '@hocs/safe-timers';
import analytics from '@segment/analytics-react-native';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
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
import {
  getSmallBalanceToggle,
  getOpenInvestmentCards,
  getOpenFamilies,
} from '../handlers/commonStorage';
import buildWalletSectionsSelector from '../helpers/buildWalletSections';
import {
  withAccountData,
  withAccountSettings,
  withBlurTransitionProps,
  withDataInit,
  withIsWalletEmpty,
  withIsWalletEthZero,
  withStatusBarStyle,
  withUniqueTokens,
  withUniswapLiquidity,
} from '../hoc';
import { setOpenSmallBalances } from '../redux/openBalances';
import { pushOpenFamilyTab } from '../redux/openFamilyTabs';
import { pushOpenInvestmentCard } from '../redux/openInvestmentCards';
import store from '../redux/store';
import { position } from '../styles';
import { deviceUtils, isNewValueForPath } from '../utils';

class WalletScreen extends Component {
  static propTypes = {
    allAssetsCount: PropTypes.number,
    assets: PropTypes.array,
    assetsTotal: PropTypes.object,
    blurIntensity: PropTypes.object,
    initializeWallet: PropTypes.func,
    isEmpty: PropTypes.bool.isRequired,
    isFocused: PropTypes.bool,
    isWalletEthZero: PropTypes.bool.isRequired,
    navigation: PropTypes.object,
    refreshAccountData: PropTypes.func,
    scrollViewTracker: PropTypes.object,
    sections: PropTypes.array,
    setSafeTimeout: PropTypes.func,
    uniqueTokens: PropTypes.array,
  }

  setInitialStatesForOpenAssets = async () => {
    const toggle = await getSmallBalanceToggle();
    const openInvestmentCards = await getOpenInvestmentCards();
    const openFamilies = await getOpenFamilies();
    await store.dispatch(setOpenSmallBalances(toggle));
    await store.dispatch(pushOpenInvestmentCard(openInvestmentCards));
    await store.dispatch(pushOpenFamilyTab(openFamilies));
    return true;
  }

  componentDidMount = async () => {
    try {
      await this.setInitialStatesForOpenAssets();
      await this.props.initializeWallet();
    } catch (error) {
      // TODO error state
    }
  }

  shouldComponentUpdate = (nextProps) => {
    const isNewBlurIntensity = isNewValueForPath(this.props, nextProps, 'blurIntensity');
    const isNewCurrency = isNewValueForPath(this.props, nextProps, 'nativeCurrency');
    const isNewFetchingAssets = isNewValueForPath(this.props, nextProps, 'fetchingAssets');
    const isNewFetchingUniqueTokens = isNewValueForPath(this.props, nextProps, 'fetchingUniqueTokens');
    const isNewIsWalletEmpty = isNewValueForPath(this.props, nextProps, 'isEmpty');
    const isNewIsWalletEthZero = isNewValueForPath(this.props, nextProps, 'isWalletEthZero');
    const isNewLanguage = isNewValueForPath(this.props, nextProps, 'language');
    const isNewSections = isNewValueForPath(this.props, nextProps, 'sections');
    const isNewTransitionProps = isNewValueForPath(this.props, nextProps, 'transitionProps');

    if (!nextProps.isFocused) {
      return isNewBlurIntensity || isNewTransitionProps;
    }

    return isNewFetchingAssets
    || isNewFetchingUniqueTokens
    || isNewIsWalletEmpty
    || isNewIsWalletEthZero
    || isNewLanguage
    || isNewCurrency
    || isNewBlurIntensity
    || isNewSections
    || isNewTransitionProps;
  }

  render = () => {
    const {
      blurIntensity,
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
          <Header justify="space-between">
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
        <BlurOverlay intensity={blurIntensity} />
      </Page>
    );
  }
}

export default compose(
  withAccountData,
  withUniqueTokens,
  withAccountSettings,
  withDataInit,
  withUniswapLiquidity,
  withSafeTimeout,
  withNavigation,
  withNavigationFocus,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withIsWalletEthZero,
  withStatusBarStyle('dark-content'),
  withProps(buildWalletSectionsSelector),
  withProps({ scrollViewTracker: new Animated.Value(0) }),
)(WalletScreen);
