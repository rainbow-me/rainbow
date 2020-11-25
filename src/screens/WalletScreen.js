import { useRoute } from '@react-navigation/core';
import { get } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash';
import { useDispatch } from 'react-redux';
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
import useExperimentalFlag, {
  DISCOVER_SHEET,
} from '../config/experimentalHooks';
import networkInfo from '../helpers/networkInfo';
import {
  useAccountEmptyState,
  useAccountSettings,
  useCoinListEdited,
  useInitializeWallet,
  useRefreshAccountData,
  useWallets,
  useWalletSectionsData,
} from '../hooks';
import { updateRefetchSavings } from '../redux/data';
import { position } from '@rainbow-me/styles';

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
  const { params } = useRoute();
  const discoverSheetAvailable = useExperimentalFlag(DISCOVER_SHEET);
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const initializeWallet = useInitializeWallet();
  const refreshAccountData = useRefreshAccountData();
  const { isCoinListEdited } = useCoinListEdited();
  const scrollViewTracker = useValue(0);
  const { isReadOnlyWallet } = useWallets();
  const { isEmpty } = useAccountEmptyState();
  const { network } = useAccountSettings();
  const {
    isWalletEthZero,
    refetchSavings,
    sections,
    shouldRefetchSavings,
  } = useWalletSectionsData();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchAndResetFetchSavings = async () => {
      await refetchSavings();
      dispatch(updateRefetchSavings(false));
    };
    if (shouldRefetchSavings) {
      fetchAndResetFetchSavings();
    }
  }, [dispatch, refetchSavings, shouldRefetchSavings]);

  useEffect(() => {
    if (!initialized) {
      // We run the migrations only once on app launch
      initializeWallet(null, null, null, true);
      setInitialized(true);
    }
  }, [initializeWallet, initialized, params]);

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
    <WalletPage testID="wallet-screen">
      <StatusBar barStyle="dark-content" />

      {/* Line below appears to be needed for having scrollViewTracker persistent while
      reattaching of react subviews */}
      <Animated.Code exec={scrollViewTracker} />
      <FabWrapper
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
          isEmpty={isEmpty || !!params?.emptyWallet}
          isWalletEthZero={isWalletEthZero}
          network={network}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
        />
      </FabWrapper>
    </WalletPage>
  );
}
