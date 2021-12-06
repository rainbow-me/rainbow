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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks/useCoinListE... Remove this comment to see the full error message
import { useCoinListEditedValue } from '@rainbow-me/hooks/useCoinListEdited';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/data' or its... Remove this comment to see the full error message
import { updateRefetchSavings } from '@rainbow-me/redux/data';
import {
  emitChartsRequest,
  emitPortfolioRequest,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/explorer' or... Remove this comment to see the full error message
} from '@rainbow-me/redux/explorer';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/usersPositio... Remove this comment to see the full error message
import { updatePositions } from '@rainbow-me/redux/usersPositions';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
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
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'initialized' does not exist on type 'obj... Remove this comment to see the full error message
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
  const numberOfPools =
    sections.find(({ pools }: any) => pools)?.data.length ?? 0;

  const dispatch = useDispatch();

  useEffect(() => {
    eth?.price?.value && dispatch(updatePositions());
  }, [dispatch, eth?.price?.value, numberOfPools]);

  const { addressSocket, assetsSocket } = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'explorer' does not exist on type 'Defaul... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'emptyWallet' does not exist on type 'obj... Remove this comment to see the full error message
    if (!initialized || (params?.emptyWallet && initialized)) {
      // We run the migrations only once on app launch
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'emptyWallet' does not exist on type 'obj... Remove this comment to see the full error message
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

  // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
  const isLoadingAssets = useSelector(state => state.data.isLoadingAssets);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <WalletPage testID="wallet-screen">
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
      {ios && <StatusBar barStyle="dark-content" />}
      {/* Line below appears to be needed for having scrollViewTracker persistent while
      reattaching of react subviews */}
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.View style={{ opacity: isCoinListEditedValue }} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Animated.Code exec={scrollViewTracker} />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <FabWrapper
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'emptyWallet' does not exist on type 'obj... Remove this comment to see the full error message
        disabled={isAccountEmpty || !!params?.emptyWallet}
        fabs={fabs}
        isCoinListEdited={isCoinListEdited}
        isReadOnlyWallet={isReadOnlyWallet}
      >
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <HeaderOpacityToggler isVisible={isCoinListEdited}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <Header justify="space-between">
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ProfileHeaderButton />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <DiscoverHeaderButton />
          </Header>
        </HeaderOpacityToggler>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <AssetList
          disableRefreshControl={isLoadingAssets}
          fetchData={refreshAccountData}
          // @ts-expect-error ts-migrate(2339) FIXME: Property 'emptyWallet' does not exist on type 'obj... Remove this comment to see the full error message
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
