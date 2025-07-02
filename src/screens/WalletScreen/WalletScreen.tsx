import { MobileWalletProtocolListener } from '@/components/MobileWalletProtocolListener';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Box } from '@/design-system';
import { useAccountAccentColor, useAccountSettings, useWalletSectionsData } from '@/hooks';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';
import { useInitializeWalletAndSetParams } from '@/hooks/useInitializeWalletAndSetParams';
import { useLoadDeferredWalletData } from '@/hooks/useLoadDeferredWalletData';
import { useRemoveScreen } from '@/hooks/useRemoveFirstScreen';
import { useWalletCohort } from '@/hooks/useWalletCohort';
import Routes from '@/navigation/Routes';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { RemoteCardsSync } from '@/state/sync/RemoteCardsSync';
import { RemotePromoSheetSync } from '@/state/sync/RemotePromoSheetSync';
import { useAccountAddress } from '@/state/wallets/walletsStore';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import React, { memo, useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecoilValue } from 'recoil';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';

const UtilityComponents = memo(function UtilityComponents() {
  return (
    <>
      <RemoteCardsSync />
      <RemotePromoSheetSync />
      <MobileWalletProtocolListener />
    </>
  );
});

const ToastComponent = memo(function ToastComponent() {
  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);
  return (
    <ToastPositionContainer>
      <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
    </ToastPositionContainer>
  );
});

const WalletScreenEffects = memo(function WalletScreenEffects() {
  useRemoveScreen(Routes.WELCOME_SCREEN);
  useInitializeWalletAndSetParams();
  useLoadDeferredWalletData();
  useWalletCohort();
  useAppIconIdentify();
  return null;
});

function WalletScreen() {
  const currentNetwork = useCurrentNetwork();
  const insets = useSafeAreaInsets();

  const isLoadingUserAssets = useUserAssetsStore(state => state.getStatus().isInitialLoading);
  const { highContrastAccentColor } = useAccountAccentColor();

  const listContainerStyle = useMemo(() => ({ flex: 1, marginTop: -(navbarHeight + insets.top) }), [insets.top]);

  return (
    <PerformanceMeasureView interactive={!isLoadingUserAssets} screenName="WalletScreen">
      <Box as={Page} flex={1} testID="wallet-screen" onLayout={handleWalletScreenMount} style={listContainerStyle}>
        <AssetList accentColor={highContrastAccentColor} network={currentNetwork} />
        <ToastComponent />
        <UtilityComponents />
        <WalletScreenEffects />
      </Box>
    </PerformanceMeasureView>
  );
}

function useCurrentNetwork(): Network {
  const network = useSelector(({ settings: { network } }: AppState) => network);
  return network;
}

function handleWalletScreenMount(): void {
  hideSplashScreen();
  requestIdleCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      useNavigationStore.setState({ isWalletScreenMounted: true });
    });
  });
}

export default React.memo(WalletScreen);
