import React from 'react';
import { AssetList } from '../components/asset-list';
import { Page } from '../components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { useAccountAccentColor, useAccountSettings, useWalletSectionsData } from '@/hooks';
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
import { useLoadDeferredData } from '@/hooks/usLoadDeferredWalletData';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';

function WalletScreen() {
  const { network: currentNetwork, accountAddress } = useAccountSettings();
  const insets = useSafeAreaInsets();

  const {
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData({ type: 'wallet' });

  useWalletCohort();
  useRemoveScreen(Routes.WELCOME_SCREEN);
  useInitializeWalletAndSetParams();
  useLoadDeferredData();
  useAppIconIdentify();

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);
  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;
  const { highContrastAccentColor } = useAccountAccentColor();

  return (
    <Box as={Page} flex={1} testID="wallet-screen">
      <Box style={{ flex: 1, marginTop: -(navbarHeight + insets.top) }}>
        <AssetList
          accentColor={highContrastAccentColor}
          disableRefreshControl={isLoadingUserAssetsAndAddress || isLoadingBalance}
          isWalletEthZero={isWalletEthZero}
          network={currentNetwork}
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </Box>
      <ToastPositionContainer>
        <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
      </ToastPositionContainer>

      {/* NOTE: The components below render null and are solely for keeping react-query and Zustand in sync */}
      <RemoteCardsSync />
      <RemotePromoSheetSync />

      {/* NOTE: This component listens for Mobile Wallet Protocol requests and handles them */}
      <MobileWalletProtocolListener />
    </Box>
  );
}

export default WalletScreen;
