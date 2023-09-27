import React, { useCallback, useEffect, useState } from 'react';
import { isEmpty, keys } from 'lodash';
import { InteractionManager, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { OpacityToggler } from '../../components/animations';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { Network } from '@/helpers';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import { settingsUpdateNetwork } from '@/redux/settings';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { prefetchENSIntroData } from '@/handlers/ens';
import { getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { Navbar, navbarHeight } from '@/components/navbar/Navbar';
import { Box, Inline } from '@/design-system';
import {
  useAccountEmptyState,
  useAccountSettings,
  useCoinListEdited,
  useInitializeAccountData,
  useInitializeWallet,
  useLoadAccountData,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  usePortfolios,
  useResetAccountState,
  useTrackENSProfile,
  useUserAccounts,
  useWalletSectionsData,
} from '@/hooks';
import { useNavigation } from '@/navigation';
import { emitPortfolioRequest } from '@/redux/explorer';
import Routes from '@rainbow-me/routes';
import { position } from '@/styles';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analytics } from '@/analytics';
import { AppState } from '@/redux/store';
import { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { usePositions } from '@/resources/defi/PositionsQuery';
import { useUserAssets } from '@/resources/assets/UserAssetsQuery';

type RouteParams = {
  WalletScreen: {
    initialized?: boolean;
    emptyWallet?: boolean;
  };
};

type Props = MaterialTopTabScreenProps<RouteParams, 'WalletScreen'>;

export const WalletScreen: React.FC<Props> = ({ navigation, route }) => {
  const { params } = route;
  const {
    setParams,
    getState: dangerouslyGetState,
    getParent: dangerouslyGetParent,
  } = navigation;
  const removeFirst = useRemoveFirst();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const [portfoliosFetched, setPortfoliosFetched] = useState(false);
  const initializeWallet = useInitializeWallet();
  const { isCoinListEdited } = useCoinListEdited();
  const { trackENSProfile } = useTrackENSProfile();
  const {
    network: currentNetwork,
    accountAddress,
    appIcon,
    nativeCurrency,
  } = useAccountSettings();
  const { userAccounts } = useUserAccounts();
  usePositions({ address: accountAddress, currency: nativeCurrency });

  const provider = getCachedProviderForNetwork(currentNetwork);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);
  useUserAssets({
    address: accountAddress,
    currency: nativeCurrency,
    connectedToHardhat,
  });

  const { portfolios, trackPortfolios } = usePortfolios();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const dispatch = useDispatch();
  const resetAccountState = useResetAccountState();
  const loadAccountData = useLoadAccountData();
  const initializeAccountData = useInitializeAccountData();
  const insets = useSafeAreaInsets();

  const revertToMainnet = useCallback(async () => {
    await resetAccountState();
    await dispatch(settingsUpdateNetwork(Network.mainnet));
    InteractionManager.runAfterInteractions(async () => {
      await loadAccountData(Network.mainnet);
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  useEffect(() => {
    const supportedNetworks = [Network.mainnet];
    if (!supportedNetworks.includes(currentNetwork)) {
      revertToMainnet();
    }
  }, [currentNetwork, revertToMainnet]);

  const walletReady = useSelector(
    ({ appState: { walletReady } }: AppState) => walletReady
  );
  const {
    isWalletEthZero,
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
      dangerouslyGetParent()?.getState().routes[0].name ===
      Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetState, removeFirst]);

  const { isEmpty: isAccountEmpty } = useAccountEmptyState(isSectionsEmpty);

  const { addressSocket, assetsSocket } = useSelector(
    ({ explorer: { addressSocket, assetsSocket } }: AppState) => ({
      addressSocket,
      assetsSocket,
    })
  );

  const profilesEnabled = useExperimentalFlag(PROFILES);

  useEffect(() => {
    const initializeAndSetParams = async () => {
      // @ts-expect-error messed up initializeWallet types
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
    if (walletReady && assetsSocket) {
      loadAccountLateData();
      loadGlobalLateData();
    }
  }, [assetsSocket, loadAccountLateData, loadGlobalLateData, walletReady]);

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

  // track current app icon
  useEffect(() => {
    analytics.identify(undefined, { appIcon });
  }, [appIcon]);

  const { navigate } = useNavigation();

  const handlePressActivity = useCallback(() => {
    navigate(Routes.PROFILE_SCREEN);
  }, [navigate]);

  const handlePressQRScanner = useCallback(() => {
    navigate(Routes.QR_SCANNER_SCREEN);
  }, [navigate]);

  const handlePressDiscover = useCallback(() => {
    navigate(Routes.DISCOVER_SCREEN);
  }, [navigate]);

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);

  const isLoadingAssets =
    useSelector((state: AppState) => state.data.isLoadingAssets) &&
    !!accountAddress;

  return (
    <Page testID="wallet-screen" style={styles.page}>
      <OpacityToggler
        endingOpacity={0.4}
        pointerEvents={isCoinListEdited ? 'none' : 'auto'}
        isVisible={isCoinListEdited}
        style={styles.opacityToggler}
      >
        <Navbar
          hasStatusBarInset
          leftComponent={
            <Navbar.Item onPress={handlePressActivity} testID="activity-button">
              <Navbar.TextIcon icon="􀐫" />
            </Navbar.Item>
          }
          rightComponent={
            <Inline space={{ custom: 17 }}>
              <Navbar.Item onPress={handlePressQRScanner}>
                <Navbar.TextIcon icon="􀎹" />
              </Navbar.Item>
              <Navbar.Item
                onPress={handlePressDiscover}
                testID="discover-button"
              >
                <Navbar.TextIcon icon="􀎬" />
              </Navbar.Item>
            </Inline>
          }
        />
      </OpacityToggler>
      <Box
        style={{ flex: 1, marginTop: ios ? -(navbarHeight + insets.top) : 0 }}
      >
        {/* @ts-expect-error JavaScript component */}
        <AssetList
          disableRefreshControl={isLoadingAssets}
          isEmpty={isAccountEmpty || !!params?.emptyWallet}
          isLoading={android && isLoadingAssets}
          isWalletEthZero={isWalletEthZero}
          network={currentNetwork}
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </Box>
      <ToastPositionContainer>
        <Toast
          isVisible={isAddressCopiedToastActive}
          text="􀁣 Address Copied"
          testID="address-copied-toast"
        />
      </ToastPositionContainer>
    </Page>
  );
};

const styles = StyleSheet.create({
  opacityToggler: {
    elevation: 1,
    zIndex: 1,
  },
  page: {
    ...position.sizeAsObject('100%'),
    flex: 1,
  },
});
