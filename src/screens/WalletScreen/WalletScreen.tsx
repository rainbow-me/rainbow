import React, { memo, useCallback, useMemo, useRef } from 'react';
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
import { useLoadDeferredWalletData } from '@/hooks/useLoadDeferredWalletData';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { InteractionManager } from 'react-native';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { addSubscribedTokens, removeSubscribedTokens } from '@/state/liveTokens/liveTokensStore';
import { debounce } from 'lodash';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { useRoute } from '@react-navigation/native';

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

function extractTokenRowIds(items: CellTypes[]) {
  return items.filter(item => item.type === 'COIN').map(item => item.uid.replace('coin-', ''));
}

function WalletScreen() {
  const { network: currentNetwork, accountAddress } = useAccountSettings();
  const insets = useSafeAreaInsets();
  const route = useRoute();

  const {
    isWalletEthZero,
    isLoadingUserAssets,
    isLoadingBalance,
    briefSectionsData: walletBriefSectionsData,
  } = useWalletSectionsData({ type: 'wallet' });

  const isLoadingUserAssetsAndAddress = isLoadingUserAssets && !!accountAddress;
  const { highContrastAccentColor } = useAccountAccentColor();

  const disableRefreshControl = useMemo(
    () => isLoadingUserAssetsAndAddress || isLoadingBalance,
    [isLoadingUserAssetsAndAddress, isLoadingBalance]
  );

  const listContainerStyle = useMemo(() => ({ flex: 1, marginTop: -(navbarHeight + insets.top) }), [insets.top]);

  const handleWalletScreenMount = useCallback(() => {
    hideSplashScreen();
    requestIdleCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        useNavigationStore.setState({ isWalletScreenMounted: true });
      });
    });
  }, []);

  // We cannot rely on `onMomentumScrollEnd` because it's not called when the user scrolls directly rather than swiping
  const debouncedAddSubscribedTokensRef = useRef(
    debounce((viewableItems, routeName) => {
      const viewableTokenUniqueIds = extractTokenRowIds(viewableItems);
      // console.log('[WalletScreen] viewableTokenUniqueIds', viewableTokenUniqueIds);
      if (viewableTokenUniqueIds.length > 0) {
        addSubscribedTokens({ route: routeName, tokenIds: viewableTokenUniqueIds });
      }
    }, 500)
  );

  const handleViewableItemsChanged = useCallback(
    ({
      viewableItems,
      viewableItemsRemoved,
    }: {
      viewableItems: CellTypes[];
      viewableItemsAdded: CellTypes[];
      viewableItemsRemoved: CellTypes[];
    }) => {
      const viewableTokenUniqueIdsRemoved = extractTokenRowIds(viewableItemsRemoved);

      // removal cannot be debounced
      if (viewableTokenUniqueIdsRemoved.length > 0) {
        removeSubscribedTokens({ route: route.name, tokenIds: viewableTokenUniqueIdsRemoved });
      }

      debouncedAddSubscribedTokensRef.current(viewableItems, route.name);
    },
    [route.name]
  );

  return (
    <PerformanceMeasureView interactive={!isLoadingUserAssets} screenName="WalletScreen">
      <Box as={Page} flex={1} testID="wallet-screen" onLayout={handleWalletScreenMount} style={listContainerStyle}>
        <AssetList
          accentColor={highContrastAccentColor}
          disableRefreshControl={disableRefreshControl}
          isWalletEthZero={isWalletEthZero}
          network={currentNetwork}
          walletBriefSectionsData={walletBriefSectionsData}
          onViewableItemsChanged={handleViewableItemsChanged}
        />
        <ToastComponent />
        <UtilityComponents />
        <WalletScreenEffects />
      </Box>
    </PerformanceMeasureView>
  );
}

export default React.memo(WalletScreen);
