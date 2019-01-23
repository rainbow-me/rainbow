import { withAccountAssets } from 'balance-common';
import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import Piwik from 'react-native-matomo';
import {
  compose,
  shouldUpdate,
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
  withTrackingDate,
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
    isLoading: PropTypes.bool.isRequired,
    isScreenActive: PropTypes.bool,
    navigation: PropTypes.object,
    onHideSplashScreen: PropTypes.func,
    onRefreshList: PropTypes.func.isRequired,
    refreshAccount: PropTypes.func,
    sections: PropTypes.array,
    showBlur: PropTypes.bool,
    toggleShowShitcoins: PropTypes.func,
    trackingDate: PropTypes.object,
    transitionProps: PropTypes.object,
    uniqueTokens: PropTypes.array,
    updateTrackingDate: PropTypes.func,
  }

  componentDidMount = async () => {
    // Initialize wallet
    const { handleWalletConfig } = this.props.navigation.getScreenProps();
    await handleWalletConfig();

    const showShitcoins = await getShowShitcoinsSetting();
    if (showShitcoins !== null) {
      this.props.toggleShowShitcoins(showShitcoins);
    }
    this.props.onHideSplashScreen();
    await this.props.refreshAccount();
  }

  componentDidUpdate = (prevProps) => {
    const {
      allAssetsCount,
      assets,
      assetsTotal,
      isScreenActive,
      trackingDate,
      uniqueTokens,
      updateTrackingDate,
    } = this.props;

    if (isScreenActive && !prevProps.isScreenActive) {
      Piwik.trackScreen('WalletScreen', 'WalletScreen');
      const totalTrackingAmount = get(assetsTotal, 'totalTrackingAmount', null);
      const assetSymbols = join(map(assets || {}, (asset) => asset.symbol));
      if (totalTrackingAmount && (!trackingDate || !isSameDay(trackingDate, Date.now()))) {
        Piwik.trackEvent('Balance', 'AssetsCount', 'TotalAssetsCount', allAssetsCount);
        Piwik.trackEvent('Balance', 'AssetSymbols', 'AssetSymbols', assetSymbols);
        Piwik.trackEvent('Balance', 'NFTCount', 'TotalNFTCount', uniqueTokens.length);
        Piwik.trackEvent('Balance', 'Total', 'TotalUSDBalance', totalTrackingAmount);

        updateTrackingDate();
      }
    }
  }

  render = () => {
    const {
      blurOpacity,
      isEmpty,
      isLoading,
      navigation,
      onRefreshList,
      sections,
      showBlur,
    } = this.props;
    return (
      <Page style={{ flex: 1, ...position.sizeAsObject('100%') }}>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          <CameraHeaderButton navigation={navigation} />
        </Header>
        <FabWrapper disabled={isEmpty}>
          <AssetList
            fetchData={onRefreshList}
            isEmpty={isEmpty}
            isLoading={isLoading}
            sections={sections}
          />
        </FabWrapper>
      </Page>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withAccountSettings,
  withFetchingPrices,
  withTrackingDate,
  withHideSplashScreen,
  withBlurTransitionProps,
  withIsWalletEmpty,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onRefreshList: ({ refreshAccount }) => async () => await refreshAccount(),
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
