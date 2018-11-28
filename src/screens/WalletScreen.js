import { get } from 'lodash';
import { isSameDay } from 'date-fns';
import { withSafeTimeout } from '@hocs/safe-timers';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import Piwik from 'react-native-matomo';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
  withState,
} from 'recompact';
import styled from 'styled-components/primitives';
import BlurOverlay from '../components/BlurOverlay';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import { ActivityHeaderButton, Header, ProfileHeaderButton } from '../components/header';
import { Page } from '../components/layout';
import buildWalletSections from '../helpers/buildWalletSections';
import {
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
  withTrackingDate,
  withTransitionProps,
} from '../hoc';
import { position } from '../styles';

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

class WalletScreen extends Component {
  static propTypes = {
    isEmpty: PropTypes.bool.isRequired,
    isLoading: PropTypes.bool.isRequired,
    navigation: PropTypes.object,
    onHideSplashScreen: PropTypes.func,
    onRefreshList: PropTypes.func.isRequired,
    sections: PropTypes.array,
    transitionProps: PropTypes.object,
  }

  componentDidMount = () => {
    this.props.trackingDateInit();
  }

  componentDidUpdate = (prevProps) => {
    const {
      assetsTotalUSD,
      isLoading,
      onHideSplashScreen,
      trackingDate
    } = this.props;
    if (!isLoading && prevProps.isLoading) {
      onHideSplashScreen();
    }

    if (this.props.isScreenActive && !prevProps.isScreenActive) {
      Piwik.trackScreen('WalletScreen', 'WalletScreen');
      const totalTrackingAmount = get(assetsTotalUSD, 'totalTrackingAmount', null);
      if (totalTrackingAmount && (!this.props.trackingDate || !isSameDay(this.props.trackingDate, Date.now()))) {
        Piwik.trackEvent('Balance', 'Total', 'TotalUSDBalance', totalTrackingAmount);
        this.props.updateTrackingDate();
      }
    }

  }

  render = () => {
    const {
      isEmpty,
      isLoading,
      navigation,
      onRefreshList,
      sections,
      transitionProps,
    } = this.props;

    const {
      effect,
      isTransitioning,
      position: transPosition,
    } = transitionProps;

    const showBlur = effect === 'expanded' && (isTransitioning || transPosition._value > 0);
    const blurOpacity = transPosition.interpolate({
      inputRange: [0, 0.01, 1],
      outputRange: [0, 1, 1],
    });

    return (
      <WalletPage>
        {showBlur && <BlurOverlay opacity={blurOpacity} />}
        <Header justify="space-between">
          <ProfileHeaderButton navigation={navigation} />
          {(!isEmpty && !isLoading) && (
            <ActivityHeaderButton navigation={navigation}/>
          )}
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
  withAccountAddress,
  withAccountAssets,
  withHideSplashScreen,
  withRequestsInit,
  withSafeTimeout,
  withTrackingDate,
  withTransitionProps,
  withState('showShitcoins', 'toggleShowShitcoins', true),
  withHandlers({
    onRefreshList: ({
      accountAddress,
      accountUpdateAccountAddress,
      setSafeTimeout,
      transactionsToApproveInit,
    }) => () => {
      accountUpdateAccountAddress(accountAddress, 'BALANCEWALLET');
      transactionsToApproveInit();
      // hack: use timeout so that it looks like loading is happening
      // accountUpdateAccountAddress does not return a promise
      return new Promise(resolve => setSafeTimeout(resolve, 2000));
    },
    onToggleShowShitcoins: ({ showShitcoins, toggleShowShitcoins }) => (index) => {
      if (index === 0) {
        toggleShowShitcoins(!showShitcoins);
      }
    },
  }),
  withProps(buildWalletSections),
  onlyUpdateForKeys(['isScreenActive', ...Object.keys(WalletScreen.propTypes)]),
)(WalletScreen);
