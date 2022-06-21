import { useRoute } from '@react-navigation/core';
import { compact, get, isEmpty, keys, map, toLower } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash/src/v1';
import { useDispatch, useSelector } from 'react-redux';
import { OpacityToggler } from '../components/animations';
import { AssetList } from '../components/asset-list';
import { ExchangeFab, FabWrapper, SendFab } from '../components/fab';
import {
  DiscoverHeaderButton,
  Header,
  ProfileHeaderButton,
  ScanHeaderButton,
} from '../components/header';
import { Page, RowWithMargins } from '../components/layout';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import {
  useAccountEmptyState,
  useAccountSettings,
  useCoinListEdited,
  useInitializeDiscoverData,
  useInitializeWallet,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  usePortfolios,
  useTrackENSProfile,
  useUserAccounts,
  useWalletENSAvatar,
  useWallets,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { updateRefetchSavings } from '@rainbow-me/redux/data';
import {
  emitChartsRequest,
  emitPortfolioRequest,
} from '@rainbow-me/redux/explorer';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';

const HeaderOpacityToggler = styled(OpacityToggler).attrs(({ isVisible }) => ({
  endingOpacity: 0.4,
  pointerEvents: isVisible ? 'none' : 'auto',
}))({
  elevation: 1,
  paddingTop: 5,
  zIndex: 1,
});

const WalletPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

export default function WalletScreen() {
  const { params } = useRoute();
  const { setParams } = useNavigation();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const [portfoliosFetched, setPortfoliosFetched] = useState(false);
  const [fetchedCharts, setFetchedCharts] = useState(false);
  const initializeWallet = useInitializeWallet();
  const { isCoinListEdited } = useCoinListEdited();
  const scrollViewTracker = useValue(0);
  const { isReadOnlyWallet } = useWallets();
  const { trackENSProfile } = useTrackENSProfile();
  const { network } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  const { portfolios, trackPortfolios } = usePortfolios();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const initializeDiscoverData = useInitializeDiscoverData();
  const { updateWalletENSAvatars } = useWalletENSAvatar();
  const walletReady = useSelector(
    ({ appState: { walletReady } }) => walletReady
  );
  const {
    isWalletEthZero,
    refetchSavings,
    sections,
    shouldRefetchSavings,
    isEmpty: isSectionsEmpty,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData();

  const { isEmpty: isAccountEmpty } = useAccountEmptyState(isSectionsEmpty);

  const dispatch = useDispatch();

  const { addressSocket, assetsSocket } = useSelector(
    ({ explorer: { addressSocket, assetsSocket } }) => ({
      addressSocket,
      assetsSocket,
    })
  );

  const profilesEnabled = useExperimentalFlag(PROFILES);

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
    const initializeAndSetParams = async () => {
      await initializeWallet(null, null, null, !params?.emptyWallet);
      setInitialized(true);
      setParams({ emptyWallet: false });
    };

    if (!initialized || (params?.emptyWallet && initialized)) {
      // We run the migrations only once on app launch
      initializeAndSetParams();
    }
  }, [initializeWallet, initialized, params, setParams]);

  useEffect(() => {
    if (initialized && addressSocket && !portfoliosFetched) {
      setPortfoliosFetched(true);
      const fetchPortfolios = async () => {
        for (let i = 0; i < userAccounts.length; i++) {
          const account = userAccounts[i];
          // Passing usd for consistency in tracking
          dispatch(emitPortfolioRequest(toLower(account.address), 'usd'));
        }
      };
      fetchPortfolios();
    }
  }, [
    addressSocket,
    dispatch,
    initialized,
    portfolios,
    portfoliosFetched,
    userAccounts,
  ]);

  useEffect(() => {
    if (profilesEnabled) {
      trackENSProfile();
    }
  }, [profilesEnabled, trackENSProfile]);

  useEffect(() => {
    if (
      !isEmpty(portfolios) &&
      portfoliosFetched &&
      keys(portfolios).length === userAccounts.length
    ) {
      trackPortfolios();
    }
  }, [portfolios, portfoliosFetched, trackPortfolios, userAccounts.length]);

  useEffect(() => {
    if (initialized && assetsSocket && !fetchedCharts) {
      const balancesSection = sections.find(({ name }) => name === 'balances');
      const assetCodes = compact(map(balancesSection?.data, 'address'));
      if (!isEmpty(assetCodes)) {
        dispatch(emitChartsRequest(assetCodes));
        setFetchedCharts(true);
      }
    }
  }, [assetsSocket, dispatch, fetchedCharts, initialized, sections]);

  useEffect(() => {
    if (walletReady && assetsSocket) {
      loadAccountLateData();
      loadGlobalLateData();
      initializeDiscoverData();
    }
  }, [
    assetsSocket,
    initializeDiscoverData,
    loadAccountLateData,
    loadGlobalLateData,
    walletReady,
  ]);

  useEffect(() => {
    if (walletReady) updateWalletENSAvatars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletReady]);

  // Show the exchange fab only for supported networks
  // (mainnet & rinkeby)
  const fabs = useMemo(
    () =>
      [
        !!get(networkInfo[network], 'exchange_enabled') && ExchangeFab,
        SendFab,
      ].filter(e => !!e),
    [network]
  );

  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);

  return (
    <WalletPage testID="wallet-screen">
      {ios && <StatusBar barStyle="dark-content" />}
      {/* Line below appears to be needed for having scrollViewTracker persistent while
      reattaching of react subviews */}
      <Animated.Code exec={scrollViewTracker} />
      <FabWrapper
        disabled={isAccountEmpty || !!params?.emptyWallet}
        fabs={fabs}
        isCoinListEdited={isCoinListEdited}
        isReadOnlyWallet={isReadOnlyWallet}
      >
        <HeaderOpacityToggler isVisible={isCoinListEdited}>
          <Header justify="space-between">
            <ProfileHeaderButton />
            <RowWithMargins margin={10}>
              <DiscoverHeaderButton />
              <ScanHeaderButton />
            </RowWithMargins>
          </Header>
        </HeaderOpacityToggler>
        <AssetList
          disableRefreshControl={isLoadingAssets}
          isEmpty={isAccountEmpty || !!params?.emptyWallet}
          isLoading={android && isLoadingAssets}
          isWalletEthZero={isWalletEthZero}
          network={network}
          scrollViewTracker={scrollViewTracker}
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </FabWrapper>
    </WalletPage>
  );
}
