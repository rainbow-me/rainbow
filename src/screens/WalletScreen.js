import { withSafeTimeout } from '@hocs/safe-timers';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect } from 'react';
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
import { withDataInit, withStatusBarStyle, withKeyboardHeight } from '../hoc';
import { useAccountSettings, useWalletSectionsData } from '../hooks';
import ExchangeFab from '../components/fab/ExchangeFab';
import SendFab from '../components/fab/SendFab';
import { position } from '../styles';
import { getKeyboardHeight } from '../handlers/localstorage/globalSettings';
import networkInfo from '../helpers/networkInfo';

const WalletScreen = ({
  initializeWallet,
  navigation,
  refreshAccountData,
  scrollViewTracker,
  setKeyboardHeight,
}) => {
  useEffect(() => {
    initializeWallet()
      .then(() => {
        getKeyboardHeight()
          .then(keyboardHeight => {
            if (keyboardHeight) {
              setKeyboardHeight(keyboardHeight);
            }
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, [initializeWallet, setKeyboardHeight]);
  const { network } = useAccountSettings();
  const { isEmpty, isWalletEthZero, sections } = useWalletSectionsData();

  /*
  shouldComponentUpdate = nextProps =>
    nextProps.navigation.getParam('focused', true) &&
    isNewValueForObjectPaths(this.props, nextProps, [
      'fetchingAssets',
      'fetchingUniqueTokens',
      'isEmpty',
      'isWalletEthZero',
      'language',
      'nativeCurrency',
      'sections',
    ]);
  */

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
        fabs={fabs}
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
          network={network}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
        />
      </FabWrapper>
    </Page>
  );
};

WalletScreen.propTypes = {
  initializeWallet: PropTypes.func,
  navigation: PropTypes.object,
  refreshAccountData: PropTypes.func,
  scrollViewTracker: PropTypes.object,
  setKeyboardHeight: PropTypes.func,
};

export default compose(
  withDataInit,
  withSafeTimeout,
  withNavigation,
  withKeyboardHeight,
  withStatusBarStyle('dark-content'),
  withProps({ scrollViewTracker: new Animated.Value(0) })
)(WalletScreen);
