import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { useRemoveFirst } from '@/navigation/useRemoveFirst';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import {
  useAccountAccentColor,
  useAccountSettings,
  useInitializeWallet,
  useLoadAccountLateData,
  useLoadGlobalLateData,
  useWallets,
  useWalletSectionsData,
} from '@/hooks';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { analyticsV2 } from '@/analytics';
import { AppState } from '@/redux/store';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { IS_ANDROID } from '@/env';
import { RemoteCardsSync } from '@/state/sync/RemoteCardsSync';
import { RemotePromoSheetSync } from '@/state/sync/RemotePromoSheetSync';
import { UserAssetsSync } from '@/state/sync/UserAssetsSync';
import { MobileWalletProtocolListener } from '@/components/MobileWalletProtocolListener';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/types';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/Routes';
import { BackendNetworks } from '@/components/BackendNetworks';
import walletTypes from '@/helpers/walletTypes';

enum WalletLoadingStates {
  IDLE = 0,
  INITIALIZING = 1,
  INITIALIZED = 2,
}

function WalletScreen() {
  const { params } = useRoute<RouteProp<RootStackParamList, 'WalletScreen'>>();
  const { setParams, getState: dangerouslyGetState, getParent: dangerouslyGetParent } = useNavigation();
  const removeFirst = useRemoveFirst();
  const walletState = useRef(WalletLoadingStates.IDLE);
  const initializeWallet = useInitializeWallet();
  const { network: currentNetwork, accountAddress, appIcon } = useAccountSettings();
  const loadAccountLateData = useLoadAccountLateData();
  const loadGlobalLateData = useLoadGlobalLateData();
  const insets = useSafeAreaInsets();
  const { wallets } = useWallets();

  const walletReady = useSelector(({ appState: { walletReady } }: AppState) => walletReady);
  const {
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData({ type: 'wallet' });

  useEffect(() => {
    if (!wallets) return;

    const identify = Object.values(wallets).reduce(
      (result, wallet) => {
        switch (wallet.type) {
          case walletTypes.mnemonic:
            result.ownedAccounts += wallet.addresses.length;
            result.recoveryPhrases += 1;
            if (wallet.imported) {
              result.importedRecoveryPhrases += 1;
              result.hasImported = true;
            }
            break;
          case walletTypes.privateKey:
            result.ownedAccounts += wallet.addresses.length;
            result.privateKeys += 1;
            if (wallet.imported) {
              result.importedPrivateKeys += 1;
              result.hasImported = true;
            }
            break;
          case walletTypes.readOnly:
            result.watchedAccounts += wallet.addresses.length;
            break;
          case walletTypes.bluetooth:
            result.hardwareAccounts += wallet.addresses.length;
            result.ledgerDevices += 1;
            break;
        }
        return result;
      },
      {
        ownedAccounts: 0,
        watchedAccounts: 0,
        recoveryPhrases: 0,
        importedRecoveryPhrases: 0,
        privateKeys: 0,
        importedPrivateKeys: 0,
        hasImported: false,
        hardwareAccounts: 0,
        ledgerDevices: 0,
        trezorDevices: 0,
      }
    );

    analyticsV2.identify({
      ownedAccounts: identify.ownedAccounts,
      hardwareAccounts: identify.hardwareAccounts,
      watchedAccounts: identify.watchedAccounts,
      recoveryPhrases: identify.recoveryPhrases,
      importedRecoveryPhrases: identify.importedRecoveryPhrases,
      privateKeys: identify.privateKeys,
      importedPrivateKeys: identify.importedPrivateKeys,
      ledgerDevices: identify.ledgerDevices,
      trezorDevices: identify.trezorDevices,
      hasImported: identify.hasImported,
    });
  }, [wallets]);

  useEffect(() => {
    // This is the fix for Android wallet creation problem.
    // We need to remove the welcome screen from the stack.
    if (!IS_ANDROID) {
      return;
    }
    const isWelcomeScreen = dangerouslyGetParent()?.getState().routes[0].name === Routes.WELCOME_SCREEN;
    if (isWelcomeScreen) {
      removeFirst();
    }
  }, [dangerouslyGetParent, dangerouslyGetState, removeFirst]);

  useEffect(() => {
    const initializeAndSetParams = async () => {
      walletState.current = WalletLoadingStates.INITIALIZING;
      // @ts-expect-error messed up initializeWallet types
      await initializeWallet(null, null, null, !params?.emptyWallet);
      walletState.current = WalletLoadingStates.INITIALIZED;
      setParams({ emptyWallet: false });
    };

    if (
      walletState.current !== WalletLoadingStates.INITIALIZING &&
      (walletState.current !== WalletLoadingStates.INITIALIZED ||
        (params?.emptyWallet && walletState.current === WalletLoadingStates.INITIALIZED))
    ) {
      // We run the migrations only once on app launch
      initializeAndSetParams();
    }
  }, [initializeWallet, params, setParams]);

  useEffect(() => {
    if (walletReady) {
      loadAccountLateData();
      loadGlobalLateData();
    }
  }, [loadAccountLateData, loadGlobalLateData, walletReady]);

  // track current app icon
  useEffect(() => {
    analyticsV2.identify({ appIcon });
  }, [appIcon]);

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);

  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;

  const { highContrastAccentColor } = useAccountAccentColor();

  return (
    <Box as={Page} flex={1} testID="wallet-screen">
      <Box style={{ flex: 1, marginTop: -(navbarHeight + insets.top) }}>
        {/* @ts-expect-error JavaScript component */}
        <AssetList
          accentColor={highContrastAccentColor}
          disableRefreshControl={isLoadingUserAssetsAndAddress || isLoadingBalance}
          isLoading={IS_ANDROID && (isLoadingUserAssetsAndAddress || isLoadingBalance)}
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
      <RemoteCardsSync />
      <RemotePromoSheetSync />
      <BackendNetworks />

      {/* NOTE: This component listens for Mobile Wallet Protocol requests and handles them */}
      <MobileWalletProtocolListener />
    </Box>
  );
}

export default WalletScreen;
