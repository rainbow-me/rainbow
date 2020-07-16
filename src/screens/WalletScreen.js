import { get } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash';
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
import { LoadingOverlayWrapper } from '../components/modal/LoadingOverlay';
import useExperimentalFlag, {
  DISCOVER_SHEET,
} from '../config/experimentalHooks';
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
import { sheetVerticalOffset } from '../navigation/effects';
import { position } from '@rainbow-me/styles';
import { usePortal } from 'react-native-cool-modals/Portal';

const HeaderOpacityToggler = styled(OpacityToggler).attrs(({ isVisible }) => ({
  endingOpacity: 0.4,
  pointerEvents: isVisible ? 'none' : 'auto',
}))`
  padding-top: 5;
  z-index: 1;
`;

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function WalletScreen() {
  const discoverSheetAvailable = useExperimentalFlag(DISCOVER_SHEET);
  const [initialized, setInitialized] = useState(false);
  const initializeWallet = useInitializeWallet();
  const refreshAccountData = useRefreshAccountData();
  const { isCoinListEdited } = useCoinListEdited();
  const { updateKeyboardHeight } = useKeyboardHeight();
  const scrollViewTracker = useValue(0);
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

  const { setComponent, hide } = usePortal();

  useEffect(() => {
    if (isCreatingAccount) {
      setComponent(
        <LoadingOverlayWrapper>
          <LoadingOverlay
            paddingTop={sheetVerticalOffset}
            title="Creating wallet..."
          />
        </LoadingOverlayWrapper>,
        true
      );
      return hide;
    }
  }, [hide, isCreatingAccount, setComponent]);

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
        <AssetList
          fetchData={refreshAccountData}
          isEmpty={isEmpty}
          isWalletEthZero={isWalletEthZero}
          network={network}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
        />
      </FabWrapper>
    </WalletPage>
  );
}
