import { get } from 'lodash';
import React, { useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useNavigation } from 'react-navigation-hooks';
import { useValues } from 'react-native-redash';
import { AssetList } from '../components/asset-list';
import { FabWrapper } from '../components/fab';
import ExchangeFab from '../components/fab/ExchangeFab';
import SendFab from '../components/fab/SendFab';
import {
  CameraHeaderButton,
  Header,
  HeaderGestureBlocker,
  ProfileHeaderButton,
} from '../components/header';
import { Page } from '../components/layout';
import { getKeyboardHeight } from '../handlers/localstorage/globalSettings';
import networkInfo from '../helpers/networkInfo';
import {
  useAccountSettings,
  useCoinListEdited,
  useInitializeWallet,
  useKeyboardHeight,
  useRefreshAccountData,
  useWalletSectionsData,
} from '../hooks';
import { position } from '../styles';

export default function WalletScreen() {
  const [initialized, setInitialized] = useState(false);
  const initializeWallet = useInitializeWallet();
  const navigation = useNavigation();
  const refreshAccountData = useRefreshAccountData();
  const { isCoinListEdited } = useCoinListEdited();
  const { updateKeyboardHeight } = useKeyboardHeight();
  const [scrollViewTracker] = useValues([0], []);

  useEffect(() => {
    if (!initialized) {
      initializeWallet();
      setInitialized(true);
    }
  }, [initializeWallet, initialized]);

  useEffect(() => {
    if (initialized) {
      getKeyboardHeight()
        .then(keyboardHeight => {
          if (keyboardHeight) {
            updateKeyboardHeight(keyboardHeight);
          }
        })
        .catch(() => {});
    }
  }, [initialized, updateKeyboardHeight]);

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
        isCoinListEdited={isCoinListEdited}
      >
        <HeaderGestureBlocker enabled={isCoinListEdited}>
          <Header marginTop={5} justify="space-between">
            <ProfileHeaderButton navigation={navigation} />
            <CameraHeaderButton navigation={navigation} />
          </Header>
        </HeaderGestureBlocker>
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
}
