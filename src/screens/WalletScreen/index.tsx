import { InteractionManager, View } from 'react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { Network } from '@/helpers';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import { settingsUpdateNetwork } from '@/redux/settings';
import useExperimentalFlag, { PROFILES } from '@/config/experimentalHooks';
import { prefetchENSIntroData } from '@/handlers/ens';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import {
  useAccountAccentColor,
  useAccountEmptyState,
  useAccountSettings,
  useInitializeAccountData,
  useInitializeWallet,
  useLoadAccountData,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  useResetAccountState,
  useTrackENSProfile,
  useWalletSectionsData,
} from '@/hooks';
import Routes from '@rainbow-me/routes';
import { position } from '@/styles';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyticsV2 } from '@/analytics';
import { AppState } from '@/redux/store';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { usePositions } from '@/resources/defi/PositionsQuery';
import styled from '@/styled-thing';
import { UserAssetsSync } from '@/__swaps__/screens/Swap/components/UserAssetsSync';

const WalletPage = styled(Page)({
  ...position.sizeAsObject('100%'),
  flex: 1,
});

const WalletScreen: React.FC<any> = ({ navigation, route }) => {
  const { params } = route;
  const { setParams, getState: dangerouslyGetState, getParent: dangerouslyGetParent } = navigation;
  const removeFirst = useRemoveFirst();
  const [initialized, setInitialized] = useState(!!params?.initialized);
  const initializeWallet = useInitializeWallet();
  const { trackENSProfile } = useTrackENSProfile();
  const { network: currentNetwork, accountAddress, appIcon, nativeCurrency } = useAccountSettings();
  usePositions({ address: accountAddress, currency: nativeCurrency });

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
      await loadAccountData();
      initializeAccountData();
    });
  }, [dispatch, initializeAccountData, loadAccountData, resetAccountState]);

  useEffect(() => {
    const supportedNetworks = [Network.mainnet];
    if (!supportedNetworks.includes(currentNetwork)) {
      revertToMainnet();
    }
  }, [currentNetwork, revertToMainnet]);

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);
  const {
    isWalletEthZero,
    isEmpty: isSectionsEmpty,
    isLoadingUserAssets,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData();

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (ios) {
      return;
    }
    const isWelcomeScreen = dangerouslyGetParent()?.getState().routes[0].name === Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetState, removeFirst]);

  const { isEmpty: isAccountEmpty } = useAccountEmptyState(isSectionsEmpty, isLoadingUserAssets);

  const { addressSocket } = useSelector(({ explorer: { addressSocket } }: AppState) => ({
    addressSocket,
  }));

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
    if (walletReady) {
      loadAccountLateData();
      loadGlobalLateData();
    }
  }, [loadAccountLateData, loadGlobalLateData, walletReady]);

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
    analyticsV2.identify({ appIcon });
  }, [appIcon]);

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);

  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;

  const { accentColor } = useAccountAccentColor();

  return (
    <View
      style={{
        height: '100%',
        width: '100%',
      }}
    >
      <WalletPage testID="wallet-screen">
        <Box style={{ flex: 1, marginTop: -(navbarHeight + insets.top) }}>
          {/* @ts-expect-error JavaScript component */}
          <AssetList
            accentColor={accentColor}
            disableRefreshControl={isLoadingUserAssetsAndAddress}
            isEmpty={isAccountEmpty || !!params?.emptyWallet}
            isLoading={android && isLoadingUserAssetsAndAddress}
            isWalletEthZero={isWalletEthZero}
            network={currentNetwork}
            walletBriefSectionsData={walletBriefSectionsData}
          />
        </Box>
        <ToastPositionContainer>
          <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
        </ToastPositionContainer>

        {/* NOTE: The components below render null and are solely for keeping react-query and Zustand in sync */}
        <UserAssetsSync />
      </WalletPage>
    </View>
  );
};

export default WalletScreen;
