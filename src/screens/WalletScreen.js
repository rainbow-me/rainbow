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
import {
  getOpenFamilies,
  getOpenInvestmentCards,
  getSmallBalanceToggle,
} from '../handlers/localstorage/accountLocal';
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
import { compareObjectsAtPaths } from '../utils';

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
    setSafeTimeout: PropTypes.func,
    uniqueTokens: PropTypes.array,
  };

  componentDidMount = async () => {
    try {
      await this.props.initializeWallet();
      await this.setInitialStatesForOpenAssets();
    } catch (error) {
      // TODO error state
    }
  };

  shouldComponentUpdate = nextProps => {
    const shouldUpdate = compareObjectsAtPaths(this.props, nextProps, [
      'fetchingAssets',
      'fetchingUniqueTokens',
      'isEmpty',
      'isWalletEthZero',
      'language',
      'nativeCurrency',
      'sections',
    ]);

    console.log('nextProps', nextProps);
    console.log('shouldUpdate', shouldUpdate);

    return shouldUpdate;
  };

  setInitialStatesForOpenAssets = async () => {
    const { accountAddress, network } = this.props;
    const toggle = await getSmallBalanceToggle(accountAddress, network);
    const openInvestmentCards = await getOpenInvestmentCards(
      accountAddress,
      network
    );
    const openFamilies = await getOpenFamilies(accountAddress, network);
    await store.dispatch(setOpenSmallBalances(toggle));
    await store.dispatch(pushOpenInvestmentCard(openInvestmentCards));
    await store.dispatch(pushOpenFamilyTab(openFamilies));
    return true;
  };

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
      </Page>
    );
  };
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
  withProps({ scrollViewTracker: new Animated.Value(0) })
)(WalletScreen);
