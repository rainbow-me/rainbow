import React from 'react';
import { Page } from '../../components/layout';
import { navbarHeight } from '@/components/navbar/Navbar';
import { Box } from '@/design-system';
import { useRefreshAccountData } from '@/hooks';
import { Toast, ToastPositionContainer } from '@/components/toasts';
import { useRecoilValue } from 'recoil';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addressCopiedToastAtom } from '@/recoil/addressCopiedToastAtom';
import { NavbarOverlay } from './NavbarOverlay';
import Animated from 'react-native-reanimated';
import { ScrollPositionProvider, useScrollPosition } from './ScrollPositionContext';
import { ProfileAvatar } from './ProfileAvatar';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { ProfileName } from './ProfileName';
import { ProfileBalance } from './ProfileBalance';
import { ProfileActionButtons } from './ProfileActionButtons';
import { RefreshControl } from 'react-native';
import { UserAssetsList } from './UserAssets/UserAssetsList';
import { SyncUserAssetsStoreWithContext, UserAssetsListProvider } from './UserAssets/UserAssetsListContext';
import { useWalletCohort } from './hooks/useWalletCohort';
import { useAppIconIdentify } from './hooks/useAppIconIdentify';
import { useRemoveFirstScreen } from './hooks/useRemoveFirstScreen';
import { useInitializeAndSetParams } from './hooks/useInitializeAndSetParams';
import { useLoadDeferredData } from './hooks/useLoadDeferredData';
import { ClaimablesHeader } from './Claimables/ClaimablesHeader';
import { Claimables } from './Claimables/Claimables';
import { ClaimablesProvider } from './Claimables/ClaimablesContext';
import { PositionsHeader } from './Positions/PositionsHeader';
import { PositionsProvider } from './Positions/PositionsContext';

function WalletPage() {
  const { scrollHandler, scrollViewRef } = useScrollPosition();
  const insets = useSafeAreaInsets();
  const { refresh, isRefreshing } = useRefreshAccountData();

  return (
    <Box as={Page} flex={1} testID="wallet-screen">
      <Box
        style={{
          flex: 1,
          marginTop: -(navbarHeight + insets.top),
        }}
      >
        <NavbarOverlay />

        <Animated.ScrollView
          refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          style={{
            flex: 1,
            paddingTop: insets.top,
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingBottom: TAB_BAR_HEIGHT + insets.top + 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <ProfileAvatar />
          <ProfileName />
          <ProfileBalance />
          <ProfileActionButtons />
          <UserAssetsListProvider>
            <UserAssetsList />
            <SyncUserAssetsStoreWithContext />
          </UserAssetsListProvider>

          <ClaimablesProvider>
            <ClaimablesHeader />
            <Claimables />
          </ClaimablesProvider>

          <PositionsProvider>
            <PositionsHeader />
          </PositionsProvider>
        </Animated.ScrollView>
      </Box>
    </Box>
  );
}

function WalletScreenToast() {
  const isAddressCopiedToastActive = useRecoilValue(addressCopiedToastAtom);

  return (
    <ToastPositionContainer>
      <Toast isVisible={isAddressCopiedToastActive} text="􀁣 Address Copied" testID="address-copied-toast" />
    </ToastPositionContainer>
  );
}

export function WalletScreen() {
  // FIXME: Move these in as much as possible?
  useWalletCohort();
  useAppIconIdentify();
  useRemoveFirstScreen();
  useInitializeAndSetParams();
  useLoadDeferredData();

  return (
    <ScrollPositionProvider>
      <WalletPage />
      <WalletScreenToast />
    </ScrollPositionProvider>
  );
}

export default WalletScreen;
