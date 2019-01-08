import { withSafeTimeout } from '@hocs/safe-timers';
import { isSameDay } from 'date-fns';
import { get, join, map } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Piwik from 'react-native-matomo';
import {
  compose,
  shouldUpdate,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import BlurOverlay from '../components/BlurOverlay';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import { CameraHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Page } from '../components/layout';
import buildWalletSections from '../helpers/buildWalletSections';
import { getShowShitcoinsSetting, updateShowShitcoinsSetting } from '../model/localstorage';
import {
  withAccountAddress,
  withAccountAssets,
  withAccountRefresh,
  withBlurTransitionProps,
  withHideSplashScreen,
  withTrackingDate,
} from '../hoc';
import { position } from '../styles';

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

class WalletScreen extends Component {
  static propTypes = {
    blurOpacity: PropTypes.object,
    isEmpty: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    navigation: PropTypes.object,
    onHideSplashScreen: PropTypes.func,
    onRefreshList: PropTypes.func.isRequired,
    sections: PropTypes.array,
    showBlur: PropTypes.bool,
    transitionProps: PropTypes.object,
  }

  componentDidMount = async () => {
    this.props.trackingDateInit();
    const showShitcoins = await getShowShitcoinsSetting();
    if (showShitcoins !== null) {
      this.props.toggleShowShitcoins(showShitcoins);
    }
  }

  componentDidUpdate = (prevProps) => {
    const {
      allAssetsCount,
      assets,
      assetsTotal,
      isLoading,
      onHideSplashScreen,
      trackingDate,
      uniqueTokens,
    } = this.props;
    if (!isLoading && prevProps.isLoading) {
      onHideSplashScreen();
    }

    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      Piwik.trackScreen('WalletScreen', 'WalletScreen');
      const totalTrackingAmount = get(assetsTotal, 'totalTrackingAmount', null);
      const assetSymbols = join(map(assets, (asset) => asset.symbol));
      if (totalTrackingAmount && (!this.props.trackingDate || !isSameDay(this.props.trackingDate, Date.now()))) {
        Piwik.trackEvent('Balance', 'AssetsCount', 'TotalAssetsCount', allAssetsCount);
        Piwik.trackEvent('Balance', 'AssetSymbols', 'AssetSymbols', assetSymbols);
        Piwik.trackEvent('Balance', 'NFTCount', 'TotalNFTCount', uniqueTokens.length);
        Piwik.trackEvent('Balance', 'Total', 'TotalUSDBalance', totalTrackingAmount);
        this.props.updateTrackingDate();
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
      <WalletPage>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          <CameraHeaderButton navigation={navigation} />
        </Header>
        <FabWrapper disable={isEmpty || isLoading}>
          <AssetList
            fetchData={onRefreshList}
            isEmpty={isEmpty && !isLoading}
            isLoading={isLoading}
            sections={sections}
          />
        </FabWrapper>
      </WalletPage>
    );
  }
}

export default compose(
  withAccountAssets,
  withAccountRefresh,
  withHideSplashScreen,
  withSafeTimeout,
  withTrackingDate,
  withBlurTransitionProps,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onRefreshList: ({
      setSafeTimeout,
      refreshAccount,
    }) => () => {
      refreshAccount();
      // hack: use timeout so that it looks like loading is happening
      return new Promise(resolve => setSafeTimeout(resolve, 2000));
    },
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        const updatedShowShitcoinsSetting = !showShitcoins;
        toggleShowShitcoins(updatedShowShitcoinsSetting);
        updateShowShitcoinsSetting(updatedShowShitcoinsSetting);
      }
    },
  }),
  withProps(buildWalletSections),
  shouldUpdate((props, { isScreenActive, ...nextProps }) => {
    if (!isScreenActive) return false;

    const finishedPopulating = props.isEmpty && !nextProps.isEmpty;
    const finishedLoading = props.isLoading && !nextProps.isLoading;
    const newSections = props.sections !== nextProps.sections;

    return finishedPopulating || finishedLoading || newSections;
  }),
)(WalletScreen);
