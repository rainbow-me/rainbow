import React, { memo, useCallback, useMemo } from 'react';
import { InteractionManager } from 'react-native';

import { PerformanceMeasureView } from '@shopify/react-native-performance';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecoilValue } from 'recoil';

import { type CellTypes } from '@/components/asset-list/RecyclerAssetList2/core/ViewTypes';
import { MobileWalletProtocolListener } from '@/components/MobileWalletProtocolListener';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { Box } from '@/design-system';
import { useShouldRevokeDelegation } from '@/features/delegation/hooks/useShouldRevokeDelegation';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import useFetchOpenCollectionsOnMount from '@/hooks/useFetchOpenCollectionsOnMount';
import { hideSplashScreen } from '@/hooks/useHideSplashScreen';
import { useAppIconIdentify } from '@/hooks/useIdentifyAppIcon';
import { useLoadDeferredWalletData } from '@/hooks/useLoadDeferredWalletData';
import { useRemoveScreen } from '@/hooks/useRemoveFirstScreen';
import { useWalletCohort } from '@/hooks/useWalletCohort';
import useWalletSectionsData from '@/hooks/useWalletSectionsData';
import { useRoute } from '@/navigation/RouteContext';
import Routes from '@/navigation/routesNames';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { useLiveTokenSubscription } from '@/state/liveTokens/useLiveTokenSubscription';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { useNftsStore } from '@/state/nfts/nfts';
import { SessionEntryPromptSync } from '@/state/sync/SessionEntryPromptSync';

import RecyclerAssetList2 from '../../components/asset-list/RecyclerAssetList2';
import { Page } from '../../components/layout';

const UtilityComponents = memo(function UtilityComponents() {
  return (
    <>
      <SessionEntryPromptSync />
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
  useShouldRevokeDelegation();
  return null;
});

function extractTokenRowIds(items: CellTypes[]) {
  return items.filter(item => item.type === 'COIN').map(item => item.uid.replace('coin-', ''));
}

function WalletScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const setSubscribedTokens = useLiveTokenSubscription(route.name);

  const { isLoadingUserAssets, briefSectionsData: walletBriefSectionsData } = useWalletSectionsData({ type: 'wallet' });

  const { highContrastAccentColor } = useAccountAccentColor();

  const listContainerStyle = useMemo(() => ({ flex: 1, marginTop: -(navbarHeight + insets.top) }), [insets.top]);

  const handleWalletScreenMount = useCallback(() => {
    hideSplashScreen();
    requestIdleCallback(() => {
      InteractionManager.runAfterInteractions(() => {
        useNavigationStore.setState({ isWalletScreenMounted: true });
      });
    });
  }, []);

  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: CellTypes[] }) => setSubscribedTokens(extractTokenRowIds(viewableItems)),
    [setSubscribedTokens]
  );

  return (
    <PerformanceMeasureView interactive={!isLoadingUserAssets} screenName="WalletScreen">
      <Box as={Page} flex={1} testID="wallet-screen" onLayout={handleWalletScreenMount} style={listContainerStyle}>
        <RecyclerAssetList2
          accentColor={highContrastAccentColor}
          onEndReached={useNftsStore.getState().fetchNextNftCollectionPage}
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
