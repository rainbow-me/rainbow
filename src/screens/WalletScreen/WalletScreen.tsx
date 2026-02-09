import React, { memo, useCallback, useMemo } from 'react';
import { AssetList } from '../../components/asset-list';
import { Page } from '../../components/layout';
import { MobileWalletProtocolListener } from '@/components/MobileWalletProtocolListener';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Box } from '@/design-system';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import useAccountSettings from '@/hooks/useAccountSettings';
import useFetchOpenCollectionsOnMount from '@/hooks/useFetchOpenCollectionsOnMount';
import useWalletSectionsData from '@/hooks/useWalletSectionsData';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';
import { useLoadDeferredWalletData } from '@/hooks/useLoadDeferredWalletData';
import { useRemoveScreen } from '@/hooks/useRemoveFirstScreen';
import { useWalletCohort } from '@/hooks/useWalletCohort';
import Routes from '@/navigation/routesNames';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { addSubscribedTokens, removeSubscribedTokens, useLiveTokensStore } from '@/state/liveTokens/liveTokensStore';
import { debounce } from 'lodash';
import { RemoteCardsSync } from '@/state/sync/RemoteCardsSync';
import { RemotePromoSheetSync } from '@/state/sync/RemotePromoSheetSync';
import { clearWalletState, useAccountAddress } from '@/state/wallets/walletsStore';
import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { InteractionManager, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecoilValue } from 'recoil';
import { useNftsStore } from '@/state/nfts/nfts';
import { useStableValue } from '@/hooks/useStableValue';
import { navigate, useRoute } from '@/navigation/Navigation';

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
  useLoadDeferredWalletData();
  useWalletCohort();
  useAppIconIdentify();
  useFetchOpenCollectionsOnMount();
  return null;
});

function extractTokenRowIds(items: CellTypes[]) {
  return items.filter(item => item.type === 'COIN').map(item => item.uid.replace('coin-', ''));
}

function WalletScreen() {
  const { network: currentNetwork } = useAccountSettings();
  const accountAddress = useAccountAddress();
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
  const devResetStyle = useMemo(
    () => ({
      position: 'absolute' as const,
      right: 12,
      top: insets.top + 8,
      zIndex: 20,
    }),
    [insets.top]
  );

  const handleDevReset = useCallback(async () => {
    await clearWalletState({ resetKeychain: true });
    navigate(Routes.WELCOME_SCREEN);
  }, []);

  const handleWalletScreenMount = useCallback(() => {
    hideSplashScreen();
    requestIdleCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        useNavigationStore.setState({ isWalletScreenMounted: true });
      });
    });
  }, []);

  // We cannot rely on `onMomentumScrollEnd` because it's not called when the user scrolls directly rather than swiping
  const debouncedAddSubscribedTokens = useStableValue(() =>
    debounce((viewableItems, routeName) => {
      const viewableTokenUniqueIds = extractTokenRowIds(viewableItems);
      if (viewableTokenUniqueIds.length > 0) {
        addSubscribedTokens({ route: routeName, tokenIds: viewableTokenUniqueIds });
        // Immediately force a fetch of the newly added tokens
        useLiveTokensStore.getState().fetch(undefined, {
          force: true,
        });
      }
    }, 250)
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

      debouncedAddSubscribedTokens(viewableItems, route.name);
    },
    [route.name, debouncedAddSubscribedTokens]
  );

  return (
    <PerformanceMeasureView interactive={!isLoadingUserAssets} screenName="WalletScreen">
      <Box as={Page} flex={1} testID="wallet-screen" onLayout={handleWalletScreenMount} style={listContainerStyle}>
        <AssetList
          accentColor={highContrastAccentColor}
          disableRefreshControl={disableRefreshControl}
          isWalletEthZero={isWalletEthZero}
          network={currentNetwork}
          onEndReached={useNftsStore.getState().fetchNextNftCollectionPage}
          walletBriefSectionsData={walletBriefSectionsData}
          onViewableItemsChanged={handleViewableItemsChanged}
        />
        <ToastComponent />
        <UtilityComponents />
        <WalletScreenEffects />
        {IS_DEV && (
          <Box position="absolute" right={{ custom: 12 }} top={{ custom: insets.top + 50 }} zIndex={20}>
            <Pressable onPress={handleDevReset} style={devResetStyle} testID="dev-reset-wallet">
              <Box backgroundColor="rgba(0, 0, 0, 0.65)" borderRadius={8} paddingHorizontal="8px" paddingVertical="4px">
                <Text color="white" size="11pt" weight="bold">
                  Reset Wallet
                </Text>
              </Box>
            </Pressable>
          </Box>
        )}
      </Box>
    </PerformanceMeasureView>
  );
}

export default React.memo(WalletScreen);
