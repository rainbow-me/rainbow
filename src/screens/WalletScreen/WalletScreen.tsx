import React, { useMemo } from 'react';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { useAccountAccentColor, useAccountSettings, useHideSplashScreen, useWalletSectionsData } from '@/hooks';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { RemoteCardsSync } from '@/state/sync/RemoteCardsSync';
import { RemotePromoSheetSync } from '@/state/sync/RemotePromoSheetSync';
import { MobileWalletProtocolListener } from '@/components/MobileWalletProtocolListener';
import Routes from '@/navigation/Routes';
import { useWalletCohort } from '@/hooks/useWalletCohort';
import { useRemoveScreen } from '@/hooks/useRemoveFirstScreen';
import { useInitializeWalletAndSetParams } from '@/hooks/useInitiailizeWalletAndSetParams';
import { useLoadDeferredWalletData } from '@/hooks/useLoadDeferredWalletData';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';
import { PerformanceMeasureView } from '@shopify/react-native-performance';

const UtilityComponents = React.memo(() => (
  <>
    <RemoteCardsSync />
    <RemotePromoSheetSync />
    <MobileWalletProtocolListener />
  </>
));

const ToastComponent = React.memo(() => {
  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);
  return (
    <ToastPositionContainer>
      <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
    </ToastPositionContainer>
  );
});

function WalletScreen() {
  const { network: currentNetwork, accountAddress } = useAccountSettings();
  const insets = useSafeAreaInsets();
  const hideSplashScreen = useHideSplashScreen();

  const {
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData({ type: 'wallet' });

  useWalletCohort();
  useRemoveScreen(Routes.WELCOME_SCREEN);
  useInitializeWalletAndSetParams();
  useLoadDeferredWalletData();
  useAppIconIdentify();

  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;
  const { highContrastAccentColor } = useAccountAccentColor();

  const disableRefreshControl = useMemo(
    () => isLoadingUserAssetsAndAddress || isLoadingBalance,
    [isLoadingUserAssetsAndAddress, isLoadingBalance]
  );

  return (
    <PerformanceMeasureView interactive={!isLoadingUserAssets} screenName="WalletScreen">
      <Box as={Page} flex={1} testID="wallet-screen" onLayout={hideSplashScreen}>
        <Box style={{ flex: 1, marginTop: -(navbarHeight + insets.top) }}>
          <AssetList
            accentColor={highContrastAccentColor}
            disableRefreshControl={disableRefreshControl}
            isWalletEthZero={isWalletEthZero}
            network={currentNetwork}
            walletBriefSectionsData={walletBriefSectionsData}
          />
        </Box>
        <ToastComponent />
        <UtilityComponents />
      </Box>
    </PerformanceMeasureView>
  );
}

export default React.memo(WalletScreen);
