import { useRoute } from '@react-navigation/core';
import { compact, find, get, isEmpty, keys, map, toLower } from 'lodash';
import React, { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { useValue } from 'react-native-redash/src/v1';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { OpacityToggler } from '../components/animations';
import { AssetList } from '../components/asset-list';
import { ExchangeFab, FabWrapper, SendFab } from '../components/fab';
import {
  DiscoverHeaderButton,
  Header,
  ProfileHeaderButton,
} from '../components/header';
import { Page } from '../components/layout';
import { useEth } from '../utils/ethereumUtils';
import networkInfo from '@rainbow-me/helpers/networkInfo';
import {
  useAccountEmptyState,
  useAccountSettings,
  useCoinListEdited,
  useInitializeWallet,
  usePortfolios,
  useRefreshAccountData,
  useUserAccounts,
  useWallets,
  useWalletSectionsData,
} from '@rainbow-me/hooks';
import { useCoinListEditedValue } from '@rainbow-me/hooks/useCoinListEdited';
import { useNavigation } from '@rainbow-me/navigation';
import { updateRefetchSavings } from '@rainbow-me/redux/data';
import {
  emitChartsRequest,
  emitPortfolioRequest,
} from '@rainbow-me/redux/explorer';
import { updatePositions } from '@rainbow-me/redux/usersPositions';
import { position } from '@rainbow-me/styles';

const HeaderOpacityToggler = styled(OpacityToggler).attrs(({ isVisible }) => ({
  endingOpacity: 0.4,
  pointerEvents: isVisible ? 'none' : 'auto',
}))`
  padding-top: 5;
  z-index: 1;
  elevation: 1;
`;

const WalletPage = styled(Page)`
  ${position.size('100%')};
  flex: 1;
`;

export default function WalletScreen() {
  const { params } = useRoute();
  const { setParams } = useNavigation();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const [portfoliosFetched, setPortfoliosFetched] = useState(false);
  const [fetchedCharts, setFetchedCharts] = useState(false);
  const initializeWallet = useInitializeWallet();
  const refreshAccountData = useRefreshAccountData();
  const { isCoinListEdited } = useCoinListEdited();
  const scrollViewTracker = useValue(0);
  const { isReadOnlyWallet } = useWallets();
  const { isEmpty: isAccountEmpty } = useAccountEmptyState();
  const { network } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  const { portfolios, trackPortfolios } = usePortfolios();

  const {
    isWalletEthZero,
    refetchSavings,
    sections,
    shouldRefetchSavings,
  } = useWalletSectionsData();

  const eth = useEth();
  const numberOfPools = sections.find(({ pools }) => pools)?.data.length ?? 0;

  const dispatch = useDispatch();

  useEffect(() => {
    eth?.price?.value && dispatch(updatePositions());
  }, [dispatch, eth?.price?.value, numberOfPools]);

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
    if (!initialized || (params?.emptyWallet && initialized)) {
      // We run the migrations only once on app launch
      initializeWallet(null, null, null, !params?.emptyWallet);
      setInitialized(true);
      setParams({ emptyWallet: false });
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

  const isCoinListEditedValue = useCoinListEditedValue();

  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);

  return (
    <WalletPage testID="wallet-screen">
      {ios && <StatusBar barStyle="dark-content" />}
      {/* Line below appears to be needed for having scrollViewTracker persistent while
      reattaching of react subviews */}
      <Animated.View style={{ opacity: isCoinListEditedValue }} />
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
            <DiscoverHeaderButton />
          </Header>
        </HeaderOpacityToggler>
        <AssetList
          disableRefreshControl={isLoadingAssets}
          fetchData={refreshAccountData}
          isEmpty={isAccountEmpty || !!params?.emptyWallet}
          isWalletEthZero={isWalletEthZero}
          network={network}
          scrollViewTracker={scrollViewTracker}
          sections={sections}
        />
      </FabWrapper>
    </WalletPage>
  );
}
