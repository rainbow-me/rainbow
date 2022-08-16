import { useRoute } from '@react-navigation/core';
import compact from 'lodash/compact';
import keys from 'lodash/keys';
import React, { useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
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
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import useExperimentalFlag, {
  PROFILES,
} from '@rainbow-me/config/experimentalHooks';
import { prefetchENSIntroData } from '@rainbow-me/handlers/ens';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import { isEmpty } from '@rainbow-me/helpers/utilities';
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
  useWallets,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import { useNavigation } from '@rainbow-me/navigation';
import { updateRefetchSavings } from '@rainbow-me/redux/data';
import {
  emitChartsRequest,
  emitPortfolioRequest,
} from '@rainbow-me/redux/explorer';
import Routes from '@rainbow-me/routes';
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
  const {
    setParams,
    dangerouslyGetState,
    dangerouslyGetParent,
  } = useNavigation();
  const removeFirst = useRemoveFirst();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const [portfoliosFetched, setPortfoliosFetched] = useState(false);
  const [fetchedCharts, setFetchedCharts] = useState(false);
  const initializeWallet = useInitializeWallet();
  const { isCoinListEdited } = useCoinListEdited();
  const { isReadOnlyWallet } = useWallets();
  const { trackENSProfile } = useTrackENSProfile();
  const { network, accountAddress } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  const { portfolios, trackPortfolios } = usePortfolios();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const initializeDiscoverData = useInitializeDiscoverData();

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

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (ios) {
      return;
    }
    const isWelcomeScreen =
      dangerouslyGetParent().dangerouslyGetState().routes[0].name ===
      Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetParent, dangerouslyGetState, removeFirst]);

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
          dispatch(emitPortfolioRequest(account.address.toLowerCase(), 'usd'));
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
      const assetCodes = compact(
        balancesSection?.data.map(({ address }) => address)
      );

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
    if (walletReady && profilesEnabled) {
      InteractionManager.runAfterInteractions(() => {
        // We are not prefetching intro profiles data on Android
        // as the RPC call queue is considerably slower.
        if (ios) {
          prefetchENSIntroData();
        }
        trackENSProfile();
      });
    }
  }, [profilesEnabled, trackENSProfile, walletReady]);

  // Show the exchange fab only for supported networks
  // (mainnet & rinkeby)
  const fabs = useMemo(
    () =>
      [!!networkInfo[network]?.exchange_enabled && ExchangeFab, SendFab].filter(
        e => !!e
      ),
    [network]
  );

  const isLoadingAssets =
    useSelector(state => state.data.isLoadingAssets) && !!accountAddress;

  return (
    <WalletPage testID="wallet-screen">
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
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </FabWrapper>
    </WalletPage>
  );
}
