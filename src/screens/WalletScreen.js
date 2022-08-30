import { useRoute } from '@react-navigation/core';
import { compact, keys } from 'lodash';
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
import { Network } from '@/helpers';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import { settingsUpdateNetwork } from '@/redux/settings';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { prefetchENSIntroData } from '@/handlers/ens';
import networkInfo from '@/helpers/networkInfo';
import { isEmpty } from '@/helpers/utilities';
import {
  useAccountEmptyState,
  useAccountSettings,
  useCoinListEdited,
  useInitializeAccountData,
  useInitializeDiscoverData,
  useInitializeWallet,
  useLoadAccountData,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  usePortfolios,
  useResetAccountState,
  useTrackENSProfile,
  useUserAccounts,
  useWallets,
  useWalletSectionsData,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import { updateRefetchSavings } from '@/redux/data';
import { emitChartsRequest, emitPortfolioRequest } from '@/redux/explorer';
import Routes from '@/navigation/routesNames';
import styled from '@/styled-thing';
import { position } from '@/styles';

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
  const { network: currentNetwork, accountAddress } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  const { portfolios, trackPortfolios } = usePortfolios();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const initializeDiscoverData = useInitializeDiscoverData();
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();

  const revertToMainnet = useCallback(async () => {
    await resetAccountState();
    await dispatch(settingsUpdateNetwork(Network.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(Network.mainnet);
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  useEffect(() => {
    const supportedNetworks = [Network.mainnet, Network.goerli];
    if (!supportedNetworks.includes(currentNetwork)) {
      revertToMainnet();
    }
  }, [currentNetwork, revertToMainnet]);

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
  // (mainnet)
  const fabs = useMemo(
    () =>
      [
        !!networkInfo[currentNetwork]?.exchange_enabled && ExchangeFab,
        SendFab,
      ].filter(e => !!e),
    [currentNetwork]
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
          network={currentNetwork}
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </FabWrapper>
    </WalletPage>
  );
}
