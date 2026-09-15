import React, { useCallback, useMemo, useRef } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useListen } from '@storesjs/stores';
import { SideDrawer, type SideDrawerInteraction, type SideDrawerMotion, type SideDrawerRef } from 'react-native-interaction-primitives';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ControlPanelMenuItem, ListAvatar, ListEmojiAvatar } from '@/components/SmoothPager/ListPanel';
import { enableActionsOnReadOnlyWallet } from '@/config/debug';
import { Box, globalColors, Stack, Text, TextIcon, useColorMode } from '@/design-system';
import { useAddCashRoute } from '@/features/cash/navigation/useAddCashRoute';
import { watchingAlert } from '@/features/wallet/utils/watchingAlert';
import { removeFirstEmojiFromString } from '@/helpers/emojiHandler';
import { navigate } from '@/navigation/Navigation';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { setIsSmallBalancesOpen } from '@/state/wallets/smallBalancesStore';
import {
  formatAccountLabel,
  getIsDamagedWallet,
  getIsReadOnlyWallet,
  setSelectedWallet,
  useAccountProfileInfo,
  useWalletsStore,
} from '@/state/wallets/walletsStore';
import { updateWalletUsage, useRecentWalletsStore } from '@/state/wallets/walletUsageStore';
import { THICKER_BORDER_WIDTH } from '@/styles/constants';
import { abbreviateEnsForDisplay, address } from '@/utils/abbreviations';

import Routes from './routesNames';

const DRAWER_INTERACTION = {
  overdrag: 5,
  release: { openThreshold: 0.5, velocitySensitivity: 1, velocityTransfer: 1.2 },
  spring: { damping: 46, mass: 0.8, stiffness: 680 },
} satisfies SideDrawerInteraction;

type CloseDrawer = (afterClose?: () => void) => void;

export function MainSideDrawer({ children }: { children: React.ReactElement }) {
  const { isDarkMode } = useColorMode();
  const { width } = useWindowDimensions();

  const drawerRef = useRef<SideDrawerRef>(null);
  const pendingWalletUsage = useRef<(() => void) | null>(null);
  const drawerWidth = Math.min(360, width * 0.76);

  const closeDrawer = useCallback<CloseDrawer>(afterClose => {
    if (afterClose) pendingWalletUsage.current = afterClose;
    drawerRef.current?.close();
  }, []);

  useListen(
    useWalletsStore,
    state => state,
    (state, previous) => {
      if (!pendingWalletUsage.current || !state.walletReady) updateWalletUsage(state, previous);
    },
    { fireImmediately: true }
  );

  const onTransitionEnd = useCallback((open: boolean) => {
    if (open) return;
    const update = pendingWalletUsage.current;
    pendingWalletUsage.current = null;
    update?.();
  }, []);

  return (
    <SideDrawer
      drawer={<DrawerMenu drawerWidth={drawerWidth} closeDrawer={closeDrawer} />}
      drawerWidth={drawerWidth}
      gestureReleaseHaptic="selection"
      interaction={DRAWER_INTERACTION}
      motion={useMemo(() => buildDrawerMotionConfig(isDarkMode), [isDarkMode])}
      onTransitionEnd={onTransitionEnd}
      ref={drawerRef}
      style={[styles.root, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FFFFFF' }]}
    >
      {children}
    </SideDrawer>
  );
}

function DrawerMenu({ drawerWidth, closeDrawer }: { drawerWidth: number; closeDrawer: CloseDrawer }) {
  const insets = useSafeAreaInsets();
  const { route: addCashRoute } = useAddCashRoute();

  const openWallet = useCallback(() => {
    closeDrawer();
    navigate(Routes.SWIPE_LAYOUT, { screen: Routes.WALLET_SCREEN });
  }, [closeDrawer]);

  const openAddCash = useCallback(() => {
    navigate(getIsDamagedWallet() ? Routes.WALLET_ERROR_SHEET : addCashRoute);
  }, [addCashRoute]);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.drawer}>
      <View
        style={[
          styles.drawerContent,
          {
            paddingBottom: Math.max(insets.bottom + 16, 32),
            paddingTop: insets.top + 24,
            width: drawerWidth,
          },
        ]}
      >
        <AccountName />

        <View style={styles.menu}>
          <Stack space="4px">
            <DrawerMenuItem icon="􁠱" label="Wallet" onPress={openWallet} />
            <DrawerMenuItem icon="􀈟" label="Send" onPress={openSend} />
            <DrawerMenuItem icon="􀫲" label="Trade" onPress={navigateToSwaps} />
            <DrawerMenuItem icon="􀁌" label="Add Cash" onPress={openAddCash} />
            <DrawerMenuItem icon="􀎹" label="Scan" onPress={openScanner} />
            <DrawerMenuItem icon="􀣋" label="Settings" onPress={openSettings} />
          </Stack>

          <View style={styles.recents}>
            <Text color="label" size="17pt" style={{ marginLeft: 10 }} weight="heavy">
              Recents
            </Text>

            <RecentWallets closeDrawer={closeDrawer} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function AccountName() {
  const { accountName, accountAddress, accountENS } = useAccountProfileInfo();

  const name = useMemo(() => {
    return (
      formatAccountLabel({ address: accountAddress, ens: abbreviateEnsForDisplay(accountENS, 20), label: accountName }) ||
      address(accountAddress, 4, 4)
    );
  }, [accountAddress, accountENS, accountName]);

  return (
    <Text color="label" size="17pt" style={{ marginLeft: 10 }} weight="heavy">
      {name}
    </Text>
  );
}

type DrawerMenuItemProps = {
  icon: string;
  label: string;
  onPress(): void;
};

function DrawerMenuItem({ icon, label, onPress }: DrawerMenuItemProps) {
  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.975} style={styles.menuItem}>
      <TextIcon color="labelTertiary" containerSize={40} size="17pt" weight="bold">
        {icon}
      </TextIcon>

      <View style={styles.menuCopy}>
        <Text color="label" size="17pt" weight="bold">
          {label}
        </Text>
      </View>
    </ButtonPressAnimation>
  );
}

function RecentWallets({ closeDrawer }: { closeDrawer: CloseDrawer }) {
  const recentWallets = useRecentWalletsStore();
  const selected = useStoreSharedValue(useWalletsStore, s => s.accountAddress.toLowerCase());

  return (
    <Box width="full">
      {recentWallets.map(({ account, wallet }) => (
        <ControlPanelMenuItem
          key={account.address.toLowerCase()}
          IconComponent={
            account.image ? (
              <ListAvatar url={account.image} size={28} />
            ) : (
              <ListEmojiAvatar address={account.address} color={account.color} emoji={account.emoji} label={account.label} size={28} />
            )
          }
          label={removeFirstEmojiFromString(account.label) || address(account.address, 6, 4)}
          onPress={() => {
            const previous = useWalletsStore.getState();
            closeDrawer(
              account.address.toLowerCase() !== previous.accountAddress.toLowerCase()
                ? () => updateWalletUsage(useWalletsStore.getState(), previous)
                : undefined
            );
            void setSelectedWallet(wallet, account.address);
            setIsSmallBalancesOpen(false);
          }}
          selectedItemId={selected}
          uniqueId={account.address.toLowerCase()}
        />
      ))}
    </Box>
  );
}

function openSend() {
  if (getIsReadOnlyWallet() && !enableActionsOnReadOnlyWallet) return watchingAlert();
  navigate(Routes.SEND_FLOW);
}

function openScanner() {
  navigate(Routes.QR_SCANNER_SCREEN);
}

function openSettings() {
  navigate(Routes.SETTINGS_SHEET);
}

function buildDrawerMotionConfig(dark: boolean): SideDrawerMotion {
  return {
    content: {
      border: dark
        ? {
            color: globalColors.white100,
            opacity: { inputRange: [0, 1], outputRange: [0, 0.06] },
            width: THICKER_BORDER_WIDTH,
          }
        : undefined,
      shadow: {
        color: globalColors.grey100,
        ios: {
          offset: { x: 0, y: 12 },
          radius: 18,
        },
        opacity: { inputRange: [0, 1], outputRange: [dark ? 0.2 : 0.08, dark ? 0.3 : 0.12] },
      },
    },
    drawer: {
      opacity: { inputRange: [0, 0.6], outputRange: [0, 1] },
      scale: { inputRange: [0, 1], outputRange: [0.97, 1] },
    },
    overlay: {
      color: dark ? globalColors.grey100 : globalColors.white100,
      opacity: { inputRange: [0, 1], outputRange: [0, dark ? 0.42 : 0.5] },
    },
  };
}

const styles = StyleSheet.create({
  drawer: {
    flex: 1,
    overflow: 'visible',
  },
  drawerContent: {
    flex: 1,
    minHeight: '100%',
    paddingHorizontal: 10,
  },
  menu: {
    flex: 1,
    marginTop: 24,
    gap: 40,
  },
  menuCopy: {
    flex: 1,
  },
  menuItem: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 16,
    flexDirection: 'row',
    gap: 5,
    height: 44,
    paddingHorizontal: 4,
  },
  recents: {
    flex: 1,
    flexDirection: 'column',
    gap: 20,
  },
  root: {
    flex: 1,
  },
});
