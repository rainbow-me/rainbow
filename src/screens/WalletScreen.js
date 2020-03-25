import { withSafeTimeout } from '@hocs/safe-timers';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
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
import { withKeyboardHeight } from '../hoc';
import {
  useAccountSettings,
  useInitializeWallet,
  useRefreshAccountData,
  useWalletSectionsData,
} from '../hooks';
import ExchangeFab from '../components/fab/ExchangeFab';
import SendFab from '../components/fab/SendFab';
import { position } from '../styles';
import { getKeyboardHeight } from '../handlers/localstorage/globalSettings';
import networkInfo from '../helpers/networkInfo';

const WalletScreen = ({ navigation, scrollViewTracker, setKeyboardHeight }) => {
  const [initialized, setInitialized] = useState(false);
  const initializeWallet = useInitializeWallet();
  const refreshAccountData = useRefreshAccountData();

  useEffect(() => {
    if (!initialized) {
      initializeWallet()
        .then(() => {
          setInitialized(true);
          getKeyboardHeight()
            .then(keyboardHeight => {
              if (keyboardHeight) {
                setKeyboardHeight(keyboardHeight);
              }
            })
            .catch(() => {
              setInitialized(true);
            });
        })
        .catch(() => {
          setInitialized(true);
        });
    }
  }, [initializeWallet, initialized, setKeyboardHeight]);

  const { network } = useAccountSettings();
  const { isEmpty, isWalletEthZero, sections } = useWalletSectionsData();

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
  navigation: PropTypes.object,
  scrollViewTracker: PropTypes.object,
  setKeyboardHeight: PropTypes.func,
};

export default compose(
  withSafeTimeout,
  withNavigation,
  withKeyboardHeight,
  withProps({ scrollViewTracker: new Animated.Value(0) })
)(WalletScreen);
