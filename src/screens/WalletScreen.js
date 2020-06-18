import { get } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { PanGestureHandler } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useValues } from 'react-native-redash';
import styled from 'styled-components/primitives';
import { OpacityToggler } from '../components/animations';
import { AssetList } from '../components/asset-list';
import { ExchangeFab, FabWrapper, SendFab } from '../components/fab';
import {
  CameraHeaderButton,
  DiscoverHeaderButton,
  Header,
  ProfileHeaderButton,
} from '../components/header';
import { Page } from '../components/layout';
import { LoadingOverlay } from '../components/modal';
import { discoverSheetAvailable } from '../config/experimental';
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
import { sheetVerticalOffset } from '../navigation/transitions/effects';
import { position } from '../styles';

const HeaderOpacityToggler = styled(OpacityToggler).attrs(({ isVisible }) => ({
  endingOpacity: 0.4,
  pointerEvents: isVisible ? 'none' : 'auto',
  startingOpacity: 1,
}))`
  padding-top: 5;
  z-index: 1;
`;

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function WalletScreen() {
  const [initialized, setInitialized] = useState(false);
  const initializeWallet = useInitializeWallet();
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
  const fabs = useMemo(
    () =>
      get(networkInfo[network], 'exchange_enabled')
        ? [ExchangeFab, SendFab]
        : [SendFab],
    [network]
  );

  return (
    <WalletPage>
      {/* Line below appears to be needed for having scrollViewTracker persistent while
      reattaching of react subviews */}
      <Animated.Code exec={scrollViewTracker} />
      <FabWrapper
        disabled={isWalletEthZero}
        fabs={fabs}
        isCoinListEdited={isCoinListEdited}
        isReadOnlyWallet={isReadOnlyWallet}
      >
        <PanGestureHandler enabled={isCoinListEdited}>
          <HeaderOpacityToggler isVisible={isCoinListEdited}>
            <Header justify="space-between">
              <ProfileHeaderButton />
              {discoverSheetAvailable ? (
                <DiscoverHeaderButton />
              ) : (
                <CameraHeaderButton />
              )}
            </Header>
          </HeaderOpacityToggler>
        </PanGestureHandler>
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
          title="Creating wallet..."
        />
      )}
    </WalletPage>
  );
}
