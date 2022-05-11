import { useRoute } from '@react-navigation/core';
import { compact, find, get, isEmpty, keys, map, toLower } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash/src/v1';
import { useDispatch, useSelector } from 'react-redux';
import { OpacityToggler } from '../components/animations';
import { AssetList } from '../components/asset-list';
import {
  ExchangeFab,
  FabWrapper,
  RegisterEnsFab,
  SendFab,
} from '../components/fab';
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
  useLoadGlobalLateData,
  usePortfolios,
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
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { first, second, third } from '@rainbow-me/handlers/imgix';

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
  const { isEmpty: isAccountEmpty } = useAccountEmptyState();
  const { network } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  const { portfolios, trackPortfolios } = usePortfolios();
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
  } = useWalletSectionsData();

  const dispatch = useDispatch();
  const profilesEnabled = useExperimentalFlag(PROFILES);

  const { addressSocket, assetsSocket } = useSelector(
    ({ explorer: { addressSocket, assetsSocket } }) => ({
      addressSocket,
      assetsSocket,
    })
  );

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
      const balancesSection = find(sections, ({ name }) => name === 'balances');
      const assetCodes = compact(map(balancesSection?.data, 'address'));
      if (!isEmpty(assetCodes)) {
        dispatch(emitChartsRequest(assetCodes));
        setFetchedCharts(true);
      }
    }
  }, [assetsSocket, dispatch, fetchedCharts, initialized, sections]);

  useEffect(() => {
    if (walletReady && assetsSocket) {
      loadGlobalLateData();
      initializeDiscoverData();
    }
  }, [assetsSocket, initializeDiscoverData, loadGlobalLateData, walletReady]);

  // Show the exchange fab only for supported networks
  // (mainnet & rinkeby)
  const fabs = useMemo(
    () =>
      [
        !!get(networkInfo[network], 'exchange_enabled') && ExchangeFab,
        SendFab,
        profilesEnabled ? RegisterEnsFab : null,
      ].filter(e => !!e),
    [network, profilesEnabled]
  );

  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);

  const sum = array => {
    return array.reduce((a, b) => a + b, 0);
  };

  const [firstAvg, setFirstAvg] = useState(0);
  const [secondAvg, setSecondAvg] = useState(0);
  const [thirdAvg, setThirdAvg] = useState(0);

  useEffect(() => {
    const callback = () => {
      setFirstAvg(
        `avg: ${(sum(first) / first.length).toFixed(2)} total: ${sum(
          first
        ).toFixed(2)} count: ${first.length}`
      );
      setSecondAvg(
        `avg: ${(sum(second) / second.length).toFixed(2)} total: ${sum(
          second
        ).toFixed(2)} count: ${second.length}`
      );
      setThirdAvg(
        `avg: ${(sum(third) / third.length).toFixed(2)} total: ${sum(
          third
        ).toFixed(2)} count: ${third.length}`
      );
      setTimeout(() => callback(), 3000);
    };
    callback();
  }, []);

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
        <View>
          <Text>{firstAvg}</Text>
          <Text>{secondAvg}</Text>
          <Text>{thirdAvg}</Text>
        </View>
        <AssetList
          disableRefreshControl={isLoadingAssets}
          isEmpty={isAccountEmpty || !!params?.emptyWallet}
          isLoading={android && isLoadingAssets}
          isWalletEthZero={isWalletEthZero}
          network={network}
          scrollViewTracker={scrollViewTracker}
        />
      </FabWrapper>
    </WalletPage>
  );
}
