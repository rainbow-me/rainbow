import { get } from 'lodash';
import React, { useEffect, useState } from 'react';
import Animated from 'react-native-reanimated';
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
import { LoadingOverlay } from '../components/modal';
import { getKeyboardHeight } from '../handlers/localstorage/globalSettings';
import networkInfo from '../helpers/networkInfo';
import {
  useAccountSettings,
  useCoinListEdited,
  useInitializeWallet,
  useKeyboardHeight,
  useRefreshAccountData,
  useWallets,
  useWalletSectionsData,
} from '../hooks';
import { useNavigation } from '../navigation/Navigation';
import { sheetVerticalOffset } from '../navigation/transitions/effects';
import { position } from '../styles';

export default function WalletScreen() {
  const [initialized, setInitialized] = useState(false);
  const initializeWallet = useInitializeWallet();
  const navigation = useNavigation();
  const refreshAccountData = useRefreshAccountData();
  const { isCoinListEdited } = useCoinListEdited();
  const { updateKeyboardHeight } = useKeyboardHeight();
  const [scrollViewTracker] = useValues([0], []);
  const { isCreatingAccount, isReadOnlyWallet } = useWallets();

  useEffect(() => {
    if (!initialized) {
      // We run the migrations only once on app launch
      initializeWallet(null, null, null, true);
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
        isCoinListEdited={isCoinListEdited}
        isReadOnlyWallet={isReadOnlyWallet}
        scrollViewTracker={scrollViewTracker}
        sections={sections}
      >
        <HeaderGestureBlocker enabled={isCoinListEdited}>
          <Header marginTop={5} justify="space-between">
            <ProfileHeaderButton />
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
      {isCreatingAccount && (
        <LoadingOverlay
          paddingTop={sheetVerticalOffset}
          title="Creating account..."
        />
      )}
    </Page>
  );
}
