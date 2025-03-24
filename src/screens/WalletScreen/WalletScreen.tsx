import React, { useEffect, useRef, useMemo } from 'react';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
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
import { ENABLE_WALLETSCREEN_PERFORMANCE_LOGS } from 'react-native-dotenv';

const ENABLE_PERF_LOGGING = ENABLE_WALLETSCREEN_PERFORMANCE_LOGS === '1';

const MemoizedAssetList = React.memo(AssetList);

const UtilityComponents = React.memo(() => (
  <>
    <RemoteCardsSync />
    <RemotePromoSheetSync />
    <MobileWalletProtocolListener />
  </>
));

function WalletScreen() {
  const renderEndTimeRef = useRef<number | null>(null);
  const isFirstRenderRef = useRef(true);

  const renderStartTime = ENABLE_PERF_LOGGING ? performance.now() : 0;

  const { network: currentNetwork, accountAddress } = useAccountSettings();
  const insets = useSafeAreaInsets();

  // Log time just before calling the expensive hook
  const preHookTime = ENABLE_PERF_LOGGING ? performance.now() : 0;

  const {
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData({ type: 'wallet' });

  // Log time after hook completes
  if (ENABLE_PERF_LOGGING) {
    const postHookTime = performance.now();
    console.log(`⏱️ [PERF] useWalletSectionsData total hook execution time: ${(postHookTime - preHookTime).toFixed(4)}ms`);
  }

  useWalletCohort();
  useRemoveScreen(Routes.WELCOME_SCREEN);
  useInitializeWalletAndSetParams();
  useLoadDeferredData();
  useAppIconIdentify();

  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);
  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;
  const { highContrastAccentColor } = useAccountAccentColor();

  // Memoize the refresh control disabled state to prevent needless re-renders
  const disableRefreshControl = useMemo(
    () => isLoadingUserAssetsAndAddress || isLoadingBalance,
    [isLoadingUserAssetsAndAddress, isLoadingBalance]
  );

  // Log render completion time
  useEffect(() => {
    if (ENABLE_PERF_LOGGING) {
      const renderEndTime = performance.now();
      const actualRenderTime = renderEndTime - renderStartTime;

      if (isFirstRenderRef.current) {
        console.log(`⏱️ [PERF] WalletScreen first render: ${actualRenderTime.toFixed(4)}ms`);
        isFirstRenderRef.current = false;
      } else {
        console.log(`⏱️ [PERF] WalletScreen re-render: ${actualRenderTime.toFixed(4)}ms`);
      }

      renderEndTimeRef.current = null;
    }
  });

  return (
    <Box as={Page} flex={1} testID="wallet-screen">
      <Box style={{ flex: 1, marginTop: -(navbarHeight + insets.top) }}>
        <MemoizedAssetList
          accentColor={highContrastAccentColor}
          disableRefreshControl={disableRefreshControl}
          isWalletEthZero={isWalletEthZero}
          network={currentNetwork}
          walletBriefSectionsData={walletBriefSectionsData}
        />
      </Box>
      <ToastPositionContainer>
        <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
      </ToastPositionContainer>

      <UtilityComponents />
    </Box>
  );
}

export default React.memo(WalletScreen);
