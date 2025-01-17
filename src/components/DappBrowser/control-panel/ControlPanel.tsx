import chroma from 'chroma-js';
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated';
import { GestureHandlerButton } from '@/__swaps__/screens/Swap/components/GestureHandlerButton';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager/SmoothPager';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { ButtonPressAnimation } from '@/components/animations';
import { ChainImage } from '@/components/coin-icon/ChainImage';
import { ImgixImage } from '@/components/images';
import {
  AnimatedText,
  Bleed,
  Box,
  Column,
  Columns,
  HitSlop,
  Inline,
  Separator,
  Stack,
  Text,
  globalColors,
  useColorMode,
  useForegroundColor,
} from '@/design-system';
import { TextColor } from '@/design-system/color/palettes';
import { IS_ANDROID, IS_IOS } from '@/env';
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { useAccountSettings, useInitializeWallet, useWallets, useWalletsWithBalancesAndNames } from '@/hooks';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { useBrowserStore } from '@/state/browser/browserStore';
import { colors } from '@/styles';
import { deviceUtils, safeAreaInsetValues, watchingAlert } from '@/utils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { TOP_INSET } from '../Dimensions';
import { formatUrl } from '../utils';
import { RouteProp, useRoute } from '@react-navigation/native';
import { toHex } from 'viem';
import * as i18n from '@/languages';
import { useDispatch } from 'react-redux';
import store from '@/redux/store';
import { getDappHost } from '@/utils/connectedApps';
import WebView from 'react-native-webview';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { address } from '@/utils/abbreviations';
import { fontWithWidthWorklet } from '@/styles/buildTextStyles';
import { useAppSessionsStore } from '@/state/appSessions';
import { RAINBOW_HOME } from '../constants';
import { FavoritedSite, useFavoriteDappsStore } from '@/state/browser/favoriteDappsStore';
import WalletTypes from '@/helpers/walletTypes';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { findWalletWithAccount } from '@/helpers/findWalletWithAccount';
import { addressSetSelected, walletsSetSelected } from '@/redux/wallets';
import { swapsStore } from '@/state/swaps/swapsStore';
import { userAssetsStore } from '@/state/assets/userAssets';
import { greaterThan } from '@/helpers/utilities';
import { ChainId } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const PAGES = {
  HOME: 'home',
  SWITCH_WALLET: 'switch-wallet',
  SWITCH_NETWORK: 'switch-network',
};

type ControlPanelParams = {
  ControlPanel: {
    activeTabRef: React.MutableRefObject<WebView | null>;
    selectedAddress: string;
  };
};

const HOME_PANEL_FULL_HEIGHT = 334;
// 44px for the component and 24px for the stack padding
const HOME_PANEL_DAPP_SECTION = 44 + 24;

export const ControlPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();
  const { accountAddress } = useAccountSettings();
  const {
    params: { activeTabRef },
  } = useRoute<RouteProp<ControlPanelParams, 'ControlPanel'>>();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const activeTabUrl = useBrowserStore(state => state.getActiveTabUrl());
  const activeTabHost = getDappHost(activeTabUrl || '') || RAINBOW_HOME;
  const updateActiveSessionNetwork = useAppSessionsStore(state => state.updateActiveSessionNetwork);
  const updateActiveSession = useAppSessionsStore(state => state.updateActiveSession);
  const addSession = useAppSessionsStore(state => state.addSession);
  const removeAppSession = useAppSessionsStore(state => state.removeAppSession);
  const hostSessions = useAppSessionsStore(state => state.getActiveSession({ host: activeTabHost }));

  const currentSession = useMemo(
    () =>
      hostSessions && hostSessions.sessions?.[hostSessions.activeSessionAddress]
        ? {
            address: hostSessions.activeSessionAddress,
            chainId: hostSessions.sessions[hostSessions.activeSessionAddress],
          }
        : null,
    [hostSessions]
  );

  const [isConnected, setIsConnected] = useState(!!(activeTabHost && currentSession?.address));
  const [currentAddress, setCurrentAddress] = useState<string>(
    currentSession?.address || hostSessions?.activeSessionAddress || accountAddress
  );
  const [currentChainId, setCurrentChainId] = useState<ChainId>(currentSession?.chainId || ChainId.mainnet);

  // listens to the current active tab and sets the account
  useEffect(() => {
    if (activeTabHost) {
      if (!currentSession) {
        setIsConnected(false);
        return;
      }

      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
      } else {
        setCurrentAddress(accountAddress);
      }

      if (currentSession?.chainId) {
        setCurrentChainId(currentSession?.chainId);
      }
    }
  }, [accountAddress, activeTabHost, currentSession]);

  const allWalletItems = useMemo(() => {
    const sortedWallets: ControlPanelMenuItemProps[] = [];
    const bluetoothWallets: ControlPanelMenuItemProps[] = [];
    const readOnlyWallets: ControlPanelMenuItemProps[] = [];

    const accountBalances: Record<string, string> = {};

    Object.values(walletsWithBalancesAndNames).forEach(wallet => {
      (wallet.addresses || [])
        .filter(account => account.visible)
        .forEach(account => {
          const balanceText = account.balancesMinusHiddenBalances
            ? account.balancesMinusHiddenBalances
            : i18n.t(i18n.l.wallet.change_wallet.loading_balance);

          const item: ControlPanelMenuItemProps = {
            IconComponent: account.image ? (
              <ListAvatar url={account.image} />
            ) : (
              <ListEmojiAvatar address={account.address} color={account.color} label={account.label} />
            ),
            label: removeFirstEmojiFromString(account.label) || address(account.address, 6, 4),
            secondaryLabel: wallet.type === WalletTypes.readOnly ? i18n.t(i18n.l.wallet.change_wallet.watching) : balanceText,
            uniqueId: account.address,
            color: colors.avatarBackgrounds[account.color],
            imageUrl: account.image || undefined,
            selected: account.address === currentAddress,
          };

          accountBalances[account.address] = account.balances?.totalBalanceAmount;

          if ([WalletTypes.mnemonic, WalletTypes.seed, WalletTypes.privateKey].includes(wallet.type)) {
            sortedWallets.push(item);
          } else if (wallet.type === WalletTypes.bluetooth) {
            bluetoothWallets.push(item);
          } else if (wallet.type === WalletTypes.readOnly) {
            readOnlyWallets.push(item);
          }
        });
    });

    sortedWallets.sort((a, b) => (greaterThan(accountBalances[b.uniqueId], accountBalances[a.uniqueId]) ? 1 : -1));
    bluetoothWallets.sort((a, b) => (greaterThan(accountBalances[b.uniqueId], accountBalances[a.uniqueId]) ? 1 : -1));

    const sortedItems = [...sortedWallets, ...bluetoothWallets, ...readOnlyWallets];

    return sortedItems;
  }, [walletsWithBalancesAndNames, currentAddress]);

  const { testnetsEnabled } = store.getState().settings;

  const allNetworkItems = useMemo(() => {
    return Object.values(useBackendNetworksStore.getState().getDefaultChains())
      .filter(({ testnet }) => testnetsEnabled || !testnet)
      .map(chain => {
        return {
          IconComponent: <ChainImage chainId={chain.id} position="relative" size={36} />,
          label: useBackendNetworksStore.getState().getChainsLabel()[chain.id],
          secondaryLabel: i18n.t(
            isConnected && chain.id === currentChainId
              ? i18n.l.dapp_browser.control_panel.connected
              : i18n.l.dapp_browser.control_panel.not_connected
          ),
          uniqueId: String(chain.id),
          selected: chain.id === currentChainId,
        };
      });
  }, [currentChainId, isConnected, testnetsEnabled]);

  const selectedWallet = allWalletItems.find(item => item.selected);

  const animatedAccentColor = useSharedValue<string | undefined>(selectedWallet?.color || globalColors.blue10);
  const selectedNetworkId = useSharedValue(currentChainId?.toString() || ChainId.mainnet.toString());
  const selectedWalletId = useSharedValue(selectedWallet?.uniqueId || accountAddress);

  const handleSwitchWallet = useCallback(
    (selectedItemId: string) => {
      const address = selectedItemId;
      updateActiveSession({ host: activeTabHost, address: address as `0x${string}` });
      if (isConnected) {
        updateActiveSessionNetwork({ host: activeTabHost, chainId: currentChainId });
        // need to emit these events to the dapp
        activeTabRef.current?.injectJavaScript(`window.ethereum.emit('accountsChanged', ['${address}']); true;`);
      }
      setCurrentAddress(address);
    },
    [activeTabHost, activeTabRef, currentChainId, isConnected, updateActiveSession, updateActiveSessionNetwork]
  );

  const handleNetworkSwitch = useCallback(
    (selectedItemId: string) => {
      const chainId = Number(selectedItemId) as ChainId;
      updateActiveSessionNetwork({ host: activeTabHost, chainId });
      activeTabRef.current?.injectJavaScript(`window.ethereum.emit('chainChanged', ${toHex(chainId)}); true;`);
      setCurrentChainId(Number(selectedItemId) as ChainId);
    },
    [activeTabHost, activeTabRef, updateActiveSessionNetwork]
  );

  const handleConnect = useCallback(async () => {
    const activeTabHost = getDappHost(activeTabUrl || '');
    const address = selectedWalletId.value;
    const chainId = Number(selectedNetworkId.value);

    addSession({
      host: activeTabHost || '',
      address: address as `0x${string}`,
      chainId,
      url: activeTabUrl || '',
    });

    activeTabRef.current?.injectJavaScript(
      `window.ethereum.emit('accountsChanged', ['${address}']); window.ethereum.emit('connect', { address: '${address}', chainId: '${toHex(chainId)}' }); true;`
    );
    setIsConnected(true);
    setCurrentAddress(address);
    setCurrentChainId(chainId);
  }, [activeTabUrl, selectedWalletId, selectedNetworkId, addSession, activeTabRef]);

  const handleDisconnect = useCallback(() => {
    const activeTabHost = getDappHost(activeTabUrl as string);
    if (activeTabHost) {
      removeAppSession({ host: activeTabHost });
      activeTabRef.current?.injectJavaScript(`window.ethereum.emit('accountsChanged', []); window.ethereum.emit('disconnect', []); true;`);
      setIsConnected(false);
    }
  }, [activeTabRef, activeTabUrl, removeAppSession]);

  return (
    <>
      <AccentColorSetter animatedAccentColor={animatedAccentColor} selectedWallet={selectedWallet} />
      <Box style={controlPanelStyles.panelContainer}>
        <SmoothPager initialPage={PAGES.HOME} ref={ref}>
          <SmoothPager.Page
            component={
              <HomePanel
                allNetworkItems={allNetworkItems}
                animatedAccentColor={animatedAccentColor}
                goToPage={goToPage}
                isConnected={isConnected}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
                selectedChainId={currentChainId}
                selectedWallet={selectedWallet}
              />
            }
            id={PAGES.HOME}
          />
          <SmoothPager.Group>
            <SmoothPager.Page
              component={
                <SwitchWalletPanel
                  allWalletItems={allWalletItems}
                  animatedAccentColor={animatedAccentColor}
                  goBack={goBack}
                  onWalletSwitch={handleSwitchWallet}
                  selectedWalletId={selectedWalletId}
                />
              }
              id={PAGES.SWITCH_WALLET}
            />
            <SmoothPager.Page
              component={
                <SwitchNetworkPanel
                  allNetworkItems={allNetworkItems}
                  animatedAccentColor={animatedAccentColor}
                  goBack={goBack}
                  onNetworkSwitch={handleNetworkSwitch}
                  selectedNetworkId={selectedNetworkId}
                />
              }
              id={PAGES.SWITCH_NETWORK}
            />
          </SmoothPager.Group>
        </SmoothPager>
      </Box>
      <TapToDismiss />
    </>
  );
};

export const TapToDismiss = memo(function TapToDismiss() {
  const { goBack } = useNavigation();
  return (
    <TouchableWithoutFeedback onPress={goBack}>
      <View style={controlPanelStyles.cover} />
    </TouchableWithoutFeedback>
  );
});

const getHighContrastAccentColor = (accentColor: string, isDarkMode: boolean) => {
  const contrast = chroma.contrast(accentColor, isDarkMode ? '#191A1C' : globalColors.white100);
  if (contrast < 2.125) {
    if (isDarkMode) {
      const brightenedColor = chroma(accentColor).brighten(1).saturate(0.5).css();
      return brightenedColor;
    } else {
      const darkenedColor = chroma(accentColor).darken(1).saturate(0.5).css();
      return darkenedColor;
    }
  } else {
    return accentColor;
  }
};

const AccentColorSetter = ({
  animatedAccentColor,
  selectedWallet,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  selectedWallet: ControlPanelMenuItemProps | undefined;
}) => {
  const { isDarkMode } = useColorMode();

  const accountColor = usePersistentDominantColorFromImage(selectedWallet?.imageUrl) || selectedWallet?.color || globalColors.blue60;
  const highContrastAccentColor = useMemo(() => getHighContrastAccentColor(accountColor, isDarkMode), [accountColor, isDarkMode]);

  useSyncSharedValue({
    sharedValue: animatedAccentColor,
    state: highContrastAccentColor,
    syncDirection: 'stateToSharedValue',
  });

  return null;
};

const HomePanel = memo(function HomePanel({
  animatedAccentColor,
  goToPage,
  selectedChainId,
  selectedWallet,
  allNetworkItems,
  isConnected,
  onConnect,
  onDisconnect,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goToPage: (pageId: string) => void;
  selectedChainId: ChainId;
  selectedWallet: ControlPanelMenuItemProps | undefined;
  allNetworkItems: ControlPanelMenuItemProps[];
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const { accountAddress } = useAccountSettings();
  const { wallets } = useWallets();
  const initializeWallet = useInitializeWallet();
  const dispatch = useDispatch();
  const { navigate } = useNavigation();

  const actionButtonList = useMemo(() => {
    const walletIcon = selectedWallet?.IconComponent || <></>;
    const walletLabel = selectedWallet?.label || '';
    const walletSecondaryLabel = selectedWallet?.secondaryLabel || '';

    const network = allNetworkItems.find(item => item.uniqueId === String(selectedChainId));
    const networkIcon = <ChainImage chainId={Number(network?.uniqueId) || ChainId.mainnet} size={36} />;
    const networkLabel = network?.label || '';
    const networkSecondaryLabel = network?.secondaryLabel || '';

    return (
      <Stack space="12px">
        <ControlPanelMenuItem
          IconComponent={walletIcon}
          animatedAccentColor={animatedAccentColor}
          label={walletLabel}
          onPress={() => goToPage(PAGES.SWITCH_WALLET)}
          secondaryLabel={walletSecondaryLabel}
          uniqueId="home-panel-wallet-item"
          variant="homePanel"
        />
        <ControlPanelMenuItem
          IconComponent={networkIcon}
          animatedAccentColor={animatedAccentColor}
          label={networkLabel}
          onPress={() => goToPage(PAGES.SWITCH_NETWORK)}
          secondaryLabel={networkSecondaryLabel}
          uniqueId="home-panel-network-item"
          variant="homePanel"
        />
      </Stack>
    );
  }, [allNetworkItems, animatedAccentColor, goToPage, selectedChainId, selectedWallet]);

  const runWalletChecksBeforeSwapOrBridge = useCallback(async () => {
    if (!selectedWallet || !wallets) return false;
    // check if read only
    const walletInPanel = findWalletWithAccount(wallets, selectedWallet.uniqueId);
    if (!walletInPanel) return false;
    if (walletInPanel?.type === WalletTypes.readOnly) {
      // show alert
      watchingAlert();
      return false;
    }

    // Check if it's different to the globally selected wallet
    if (selectedWallet.uniqueId !== accountAddress) {
      // switch to selected wallet
      const p1 = dispatch(walletsSetSelected(walletInPanel));
      const p2 = dispatch(addressSetSelected(selectedWallet.uniqueId));
      await Promise.all([p1, p2]);
      initializeWallet(null, null, null, false, false, null, true, null);
    }
    return true;
  }, [accountAddress, dispatch, initializeWallet, selectedWallet, wallets]);

  const handleOnPressSwap = useCallback(async () => {
    const valid = await runWalletChecksBeforeSwapOrBridge();
    if (!valid) return;

    swapsStore.setState({ inputAsset: userAssetsStore.getState().getHighestValueNativeAsset() });
    InteractionManager.runAfterInteractions(() => navigate(Routes.SWAP));
  }, [navigate, runWalletChecksBeforeSwapOrBridge]);

  const handleOnPressBridge = useCallback(async () => {
    const valid = await runWalletChecksBeforeSwapOrBridge();
    if (!valid) return;

    swapsStore.setState({ inputAsset: userAssetsStore.getState().getHighestValueNativeAsset() });
    InteractionManager.runAfterInteractions(() => navigate(Routes.SWAP));
  }, [navigate, runWalletChecksBeforeSwapOrBridge]);

  const isOnHomepage = useBrowserStore(state => (state.getActiveTabUrl() || RAINBOW_HOME) === RAINBOW_HOME);

  return (
    <Panel height={isOnHomepage ? HOME_PANEL_FULL_HEIGHT - HOME_PANEL_DAPP_SECTION : HOME_PANEL_FULL_HEIGHT}>
      <Box style={controlPanelStyles.homePanel}>
        <Stack space="24px">
          {!isOnHomepage && (
            <Box paddingHorizontal="8px">
              <Columns alignVertical="center" space={{ custom: 14 }}>
                <Column width="content">
                  <HomePanelLogo />
                </Column>
                <Column>
                  <HomePanelTitleSection />
                </Column>
              </Columns>
            </Box>
          )}
          <Box paddingHorizontal="8px" width="full">
            <Inline alignHorizontal="justify" alignVertical="center">
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀖅"
                label={i18n.t(i18n.l.dapp_browser.control_panel.swap)}
                onPress={handleOnPressSwap}
              />
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀄹"
                label={i18n.t(i18n.l.dapp_browser.control_panel.bridge)}
                onPress={handleOnPressBridge}
              />
              {isOnHomepage ? (
                <DisabledControlPanelButton icon="􀋦" label={i18n.t(i18n.l.dapp_browser.control_panel.connect)} />
              ) : (
                <ConnectButton isConnected={isConnected} onConnect={onConnect} onDisconnect={onDisconnect} />
              )}
              {isOnHomepage ? (
                <DisabledControlPanelButton icon="􀋂" label={i18n.t(i18n.l.dapp_browser.control_panel.favorite)} />
              ) : (
                <FavoriteButton animatedAccentColor={animatedAccentColor} />
              )}
            </Inline>
          </Box>
          {actionButtonList}
        </Stack>
      </Box>
    </Panel>
  );
});

const HomePanelLogo = memo(function HomePanelLogo() {
  const logoUrl = useBrowserStore(state => state.getActiveTabLogo());
  return (
    <Box
      as={ImgixImage}
      enableFasterImage
      fm="png"
      size={44}
      source={{ uri: logoUrl || '' }}
      width={{ custom: 44 }}
      height={{ custom: 44 }}
      background="fillTertiary"
      style={{ borderRadius: IS_ANDROID ? 30 : 12 }}
    />
  );
});

const HomePanelTitleSection = memo(function HomePanelTitleSection() {
  const activeTabUrl = useBrowserStore(state => state.getActiveTabUrl());
  const activeTabTitle = useBrowserStore(state => state.getActiveTabTitle());
  return (
    <Stack space="12px">
      <Text color="label" numberOfLines={1} size="20pt" weight="heavy">
        {activeTabTitle}
      </Text>
      <Text color="labelTertiary" size="15pt" weight="bold">
        {formatUrl(activeTabUrl || '', false)}
      </Text>
    </Stack>
  );
});

const SwitchWalletPanel = memo(function SwitchWalletPanel({
  allWalletItems,
  animatedAccentColor,
  goBack,
  onWalletSwitch,
  selectedWalletId,
}: {
  allWalletItems: ControlPanelMenuItemProps[];
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  onWalletSwitch: (selectedItemId: string) => void;
  selectedWalletId: SharedValue<string>;
}) {
  const handleOnSelect = useCallback(
    (selectedItemId: string) => {
      onWalletSwitch(selectedItemId);
      goBack();
    },
    [goBack, onWalletSwitch]
  );
  return (
    <ListPanel
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={allWalletItems}
      pageTitle={i18n.t(i18n.l.dapp_browser.control_panel.switch_wallet)}
      onSelect={handleOnSelect}
      selectedItemId={selectedWalletId}
    />
  );
});

const SwitchNetworkPanel = memo(function SwitchNetworkPanel({
  allNetworkItems,
  animatedAccentColor,
  goBack,
  onNetworkSwitch,
  selectedNetworkId,
}: {
  allNetworkItems: ControlPanelMenuItemProps[];
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  onNetworkSwitch: (selectedItemId: string) => void;
  selectedNetworkId: SharedValue<string>;
}) {
  const handleOnSelect = useCallback(
    (selectedItemId: string) => {
      onNetworkSwitch(selectedItemId);
      goBack();
    },
    [goBack, onNetworkSwitch]
  );
  return (
    <ListPanel
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={allNetworkItems}
      pageTitle={i18n.t(i18n.l.dapp_browser.control_panel.switch_network)}
      selectedItemId={selectedNetworkId}
      onSelect={handleOnSelect}
    />
  );
});

const LIST_SCROLL_INDICATOR_BOTTOM_INSET = { bottom: 42 };

const ListPanel = ({
  animatedAccentColor,
  goBack,
  items,
  pageTitle,
  onSelect,
  selectedItemId,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  items?: ControlPanelMenuItemProps[];
  pageTitle: string;
  onSelect: (selectedItemId: string) => void;
  selectedItemId: SharedValue<string>;
}) => {
  const memoizedItems = useMemo(() => items, [items]);

  return (
    <Panel>
      <Box style={controlPanelStyles.listPanel}>
        <ListHeader animatedAccentColor={animatedAccentColor} goBack={goBack} title={pageTitle} />
        <ScrollView
          contentContainerStyle={controlPanelStyles.listScrollViewContentContainer}
          scrollIndicatorInsets={LIST_SCROLL_INDICATOR_BOTTOM_INSET}
          style={[
            controlPanelStyles.listScrollView,
            {
              height: Math.min(
                (memoizedItems?.length ?? 0) * 56 +
                  controlPanelStyles.listScrollViewContentContainer.paddingBottom +
                  controlPanelStyles.listScrollViewContentContainer.paddingTop,
                controlPanelStyles.listScrollView.maxHeight
              ),
            },
          ]}
        >
          <Box width="full">
            {memoizedItems?.map(item => (
              <ControlPanelMenuItem
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...item}
                animatedAccentColor={animatedAccentColor}
                key={item.uniqueId}
                onPress={() => onSelect(item.uniqueId)}
                selectedItemId={selectedItemId}
              />
            ))}
          </Box>
        </ScrollView>
      </Box>
    </Panel>
  );
};

const ListHeader = memo(function ListHeader({
  animatedAccentColor,
  goBack,
  rightComponent,
  title,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  rightComponent?: React.ReactNode;
  title: string;
}) {
  const backIconStyle = useAnimatedStyle(() => {
    return {
      color: animatedAccentColor?.value,
      ...fontWithWidthWorklet('700'),
    };
  });

  return (
    <Box style={controlPanelStyles.listHeader}>
      <Box style={controlPanelStyles.listHeaderContent}>
        <ButtonPressAnimation onPress={goBack} scaleTo={0.8} style={controlPanelStyles.listHeaderButtonWrapper}>
          <Box alignItems="center" height={{ custom: 20 }} justifyContent="center" width={{ custom: 20 }}>
            <AnimatedText align="center" size="icon 20px" style={backIconStyle} weight="bold">
              􀆉
            </AnimatedText>
          </Box>
        </ButtonPressAnimation>
        <Box alignItems="center" justifyContent="center" paddingHorizontal="44px" width="full">
          <Text align="center" color="label" size="20pt" weight="heavy">
            {title}
          </Text>
        </Box>
        <Box style={[controlPanelStyles.listHeaderButtonWrapper, controlPanelStyles.listHeaderRightComponent]}>{rightComponent}</Box>
      </Box>
      <Box width="full">
        <Separator color="separatorTertiary" thickness={1} />
      </Box>
    </Box>
  );
});

interface ControlPanelMenuItemProps {
  IconComponent: React.ReactNode;
  animatedAccentColor?: SharedValue<string | undefined>;
  label: string;
  labelColor?: TextColor;
  imageUrl?: string;
  color?: string;
  onPress?: () => void;
  secondaryLabel?: string;
  secondaryLabelColor?: TextColor;
  selected?: boolean;
  selectedItemId?: SharedValue<string>;
  uniqueId: string;
  variant?: 'homePanel';
}

const ControlPanelMenuItem = memo(function ControlPanelMenuItem({
  IconComponent,
  animatedAccentColor,
  label,
  onPress,
  secondaryLabel,
  secondaryLabelColor,
  selectedItemId,
  uniqueId,
  variant,
}: ControlPanelMenuItemProps) {
  const { isDarkMode } = useColorMode();
  const labelTextColor = useForegroundColor('label');
  const separatorSecondary = useForegroundColor('separatorSecondary');
  const borderColor = isDarkMode ? opacity(separatorSecondary, 0.02) : opacity(separatorSecondary, 0.015);

  const handlePress = useCallback(() => {
    if (selectedItemId) {
      selectedItemId.value = uniqueId;
    }

    onPress?.();
  }, [onPress, selectedItemId, uniqueId]);

  const selectedStyle = useAnimatedStyle(() => {
    const selected = selectedItemId?.value === uniqueId || variant === 'homePanel';
    return {
      // eslint-disable-next-line no-nested-ternary
      backgroundColor: selected ? (isDarkMode ? globalColors.white10 : '#F7F7F9') : 'transparent',
      borderColor: selected ? borderColor : 'transparent',
      borderWidth: !selected || IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
      paddingLeft: !selected || IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
      paddingRight: !selected || IS_ANDROID ? 14 : 14 - THICK_BORDER_WIDTH,
      paddingVertical: !selected || IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
    };
  });

  const selectedTextStyle = useAnimatedStyle(() => {
    const selected = selectedItemId?.value === uniqueId || variant === 'homePanel';
    return {
      color: selected ? animatedAccentColor?.value : labelTextColor,
      ...fontWithWidthWorklet(selected || variant === 'homePanel' ? '700' : '600'),
    };
  });

  return (
    <ButtonPressAnimation onPress={handlePress} scaleTo={0.94}>
      <Animated.View style={[selectedStyle, variant === 'homePanel' ? controlPanelStyles.menuItemLarge : controlPanelStyles.menuItem]}>
        <Columns alignVertical="center" space="12px">
          <Column width="content">
            <Box style={controlPanelStyles.menuItemIconContainer}>{IconComponent}</Box>
          </Column>
          <Stack space="10px">
            <AnimatedText numberOfLines={1} size="17pt" style={selectedTextStyle}>
              {label}
            </AnimatedText>
            {secondaryLabel && (
              <Text
                color={secondaryLabelColor || (variant === 'homePanel' ? 'labelTertiary' : 'labelQuaternary')}
                numberOfLines={1}
                size="13pt"
                weight="bold"
              >
                {secondaryLabel}
              </Text>
            )}
          </Stack>
          {variant === 'homePanel' && (
            <Column width="content">
              <Box alignItems="center" height={{ custom: 24 }} justifyContent="center" width={{ custom: 24 }}>
                <AnimatedText align="center" size="icon 17px" style={selectedTextStyle} weight="heavy">
                  􀆊
                </AnimatedText>
              </Box>
            </Column>
          )}
        </Columns>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

const ListAvatar = memo(function ListAvatar({ size = 36, url }: { size?: number; url: string }) {
  return (
    <ImgixImage enableFasterImage size={size ?? 36} source={{ uri: url }} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
});

const ListEmojiAvatar = memo(function ListEmojiAvatar({
  address,
  color,
  label,
  size = 36,
}: {
  address: string;
  color: number | string;
  label: string;
  size?: number;
}) {
  const fillTertiary = useForegroundColor('fillTertiary');
  const emojiAvatar = returnStringFirstEmoji(label);
  const accountSymbol = returnStringFirstEmoji(emojiAvatar || addressHashedEmoji(address)) || '';

  const backgroundColor =
    typeof color === 'number'
      ? // sometimes the color is gonna be missing so we fallback to white
        // otherwise there will be only shadows without the the placeholder "circle"
        colors.avatarBackgrounds[color] ?? fillTertiary
      : color;

  return (
    <Box
      alignItems="center"
      borderRadius={size / 2}
      height={{ custom: size }}
      justifyContent="center"
      style={{ backgroundColor }}
      width={{ custom: size }}
    >
      <Text align="center" color="label" containsEmoji size="icon 18px" weight="heavy">
        {accountSymbol}
      </Text>
    </Box>
  );
});

const ControlPanelButton = memo(function ControlPanelButton({
  animatedAccentColor,
  icon,
  label,
  onPress,
}: {
  animatedAccentColor?: SharedValue<string | undefined>;
  icon: string;
  label: string;
  onPress: () => void;
}) {
  const backgroundColor = useAnimatedStyle(() => ({ backgroundColor: animatedAccentColor?.value }));
  const buttonTextColor = useAnimatedStyle(() => ({ color: getHighContrastTextColorWorklet(animatedAccentColor?.value) }));

  return (
    <ButtonPressAnimation onPress={onPress} style={controlPanelStyles.buttonContainer} scaleTo={0.82}>
      <HitSlop horizontal="16px" vertical="10px">
        <Stack alignHorizontal="center" space="10px">
          <Box as={Animated.View} background="accent" style={[controlPanelStyles.button, backgroundColor]}>
            <AnimatedText align="center" color="label" size="icon 20px" style={buttonTextColor} weight="heavy">
              {icon}
            </AnimatedText>
          </Box>
          <Bleed horizontal="20px">
            <Text align="center" color="labelQuaternary" numberOfLines={1} size="12pt" weight="bold">
              {label}
            </Text>
          </Bleed>
        </Stack>
      </HitSlop>
    </ButtonPressAnimation>
  );
});

const FavoriteButton = memo(function FavButton({ animatedAccentColor }: { animatedAccentColor: SharedValue<string | undefined> }) {
  const tabId = useBrowserStore(state => state.getActiveTabId());
  const tabData = useBrowserStore(state => state.getTabData(tabId));
  const isFavorite = useFavoriteDappsStore(state => state.isFavorite(tabData?.url || ''));
  const removeFavorite = useFavoriteDappsStore(state => state.removeFavorite);
  const addFavorite = useFavoriteDappsStore(state => state.addFavorite);

  const handlePress = useCallback(() => {
    if (isFavorite) {
      removeFavorite(tabData?.url || '');
    } else {
      const site: FavoritedSite = {
        name: tabData?.title || '',
        url: tabData?.url || '',
        image: tabData?.logoUrl || '',
      };
      tabData && addFavorite(site);
    }
  }, [addFavorite, isFavorite, removeFavorite, tabData]);

  return (
    <ControlPanelButton
      animatedAccentColor={animatedAccentColor}
      icon={isFavorite ? '􀋇' : '􀋂'}
      label={isFavorite ? i18n.t(i18n.l.dapp_browser.control_panel.undo_favorite) : i18n.t(i18n.l.dapp_browser.control_panel.favorite)}
      onPress={handlePress}
    />
  );
});

const DisabledControlPanelButton = memo(function ControlPanelButton({ icon, label }: { icon: string; label: string }) {
  const { isDarkMode } = useColorMode();

  const disabledColor = opacity(isDarkMode ? globalColors.white80 : globalColors.grey80, 1);

  return (
    <Box style={{ opacity: 0.5 }}>
      <Stack alignHorizontal="center" space="10px">
        <Box
          style={[
            controlPanelStyles.button,
            controlPanelStyles.connectButton,
            {
              backgroundColor: opacity(disabledColor, isDarkMode ? 0.16 : 0.08),
              borderColor: opacity(disabledColor, isDarkMode ? 0.08 : 0.03),
            },
          ]}
        >
          <Text align="center" color="labelQuaternary" size="icon 20px" weight="heavy">
            {icon}
          </Text>
        </Box>
        <Bleed horizontal="20px">
          <Text align="center" color="labelQuaternary" numberOfLines={1} size="12pt" weight="bold">
            {label}
          </Text>
        </Bleed>
      </Stack>
    </Box>
  );
});

const ConnectButton = memo(function ControlPanelButton({
  isConnected,
  onConnect,
  onDisconnect,
}: {
  isConnected: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const { isDarkMode } = useColorMode();

  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const buttonColor = useDerivedValue(() => {
    return withTiming(isConnected ? red : green, TIMING_CONFIGS.slowerFadeConfig);
  });

  const buttonIcon = useDerivedValue<string>(() => {
    return isConnected ? '􀋪' : '􀋦';
  });

  const disconnectLabel = i18n.t(i18n.l.dapp_browser.control_panel.disconnect);
  const connectLabel = i18n.t(i18n.l.dapp_browser.control_panel.connect);
  const buttonLabel = useDerivedValue(() => {
    return isConnected ? disconnectLabel : connectLabel;
  });

  const buttonBackground = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(buttonColor.value, isDarkMode ? 0.16 : 0.9),
      borderColor: IS_IOS ? opacityWorklet(buttonColor.value, isDarkMode ? 0.08 : 0.3) : undefined,
    };
  });
  const buttonIconStyle = useAnimatedStyle(() => {
    return {
      color: isDarkMode ? buttonColor.value : globalColors.white100,
      textShadowColor: isDarkMode ? opacityWorklet(buttonColor.value, 0.8) : buttonColor.value,
    };
  });

  const handlePress = useCallback(() => {
    'worklet';
    if (isConnected) {
      if (onDisconnect) {
        runOnJS(onDisconnect)();
      }
    } else {
      if (onConnect) {
        runOnJS(onConnect)();
      }
    }
  }, [isConnected, onConnect, onDisconnect]);

  return (
    <View style={controlPanelStyles.connectButtonContainer}>
      <GestureHandlerButton
        hapticTrigger="tap-end"
        onPressWorklet={handlePress}
        pointerEvents="auto"
        scaleTo={0.82}
        style={[controlPanelStyles.buttonContainer]}
      >
        <Box paddingHorizontal={IS_IOS ? '16px' : undefined} paddingVertical={IS_IOS ? '10px' : undefined}>
          <Stack alignHorizontal="center" space="10px">
            <Box as={Animated.View} style={[controlPanelStyles.button, controlPanelStyles.connectButton, buttonBackground]}>
              <Bleed space="16px">
                <AnimatedText
                  align="center"
                  size="icon 20px"
                  style={[buttonIconStyle, controlPanelStyles.connectButtonIcon]}
                  weight="heavy"
                >
                  {buttonIcon}
                </AnimatedText>
              </Bleed>
            </Box>
            <Bleed horizontal="20px">
              <AnimatedText align="center" color="labelQuaternary" numberOfLines={1} size="12pt" weight="bold">
                {buttonLabel}
              </AnimatedText>
            </Bleed>
          </Stack>
        </Box>
      </GestureHandlerButton>
    </View>
  );
});

function Panel({ children, height }: { children?: React.ReactNode; height?: number }) {
  const { isDarkMode } = useColorMode();
  const separatorSecondary = useForegroundColor('separatorSecondary');

  return (
    <Box
      style={[
        controlPanelStyles.panel,
        isDarkMode ? controlPanelStyles.panelBackgroundDark : controlPanelStyles.panelBackgroundLight,
        { height },
      ]}
    >
      {children}
      {IS_IOS && isDarkMode && (
        <Box style={controlPanelStyles.panelBorderContainer}>
          <Box style={[controlPanelStyles.panelBorder, { borderColor: separatorSecondary }]} />
        </Box>
      )}
    </Box>
  );
}

const controlPanelStyles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  buttonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectButton: {
    borderWidth: IS_IOS ? THICK_BORDER_WIDTH : 0,
  },
  connectButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -16,
    marginVertical: -10,
  },
  connectButtonIcon: {
    padding: 16,
    textShadowOffset: { height: 0, width: 0 },
    textShadowRadius: 16,
  },
  cover: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  homePanel: {
    height: '100%',
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 28,
    width: '100%',
  },
  listHeader: {
    alignItems: 'center',
    height: 65,
    justifyContent: 'center',
    width: '100%',
  },
  listHeaderButtonWrapper: {
    alignItems: 'center',
    height: 52,
    justifyContent: 'center',
    left: -6,
    position: 'absolute',
    width: 52,
    zIndex: 10,
  },
  listHeaderContent: {
    alignItems: 'center',
    height: 64,
    justifyContent: 'center',
    width: '100%',
  },
  listHeaderRightComponent: {
    left: undefined,
    right: -6,
  },
  listPanel: {
    paddingHorizontal: 14,
    paddingTop: 2,
    width: '100%',
  },
  listScrollView: {
    marginHorizontal: -14,
    paddingHorizontal: 14,
    maxHeight: deviceUtils.dimensions.height - TOP_INSET - 91 * 2 - 65 - 56,
  },
  listScrollViewContentContainer: {
    paddingBottom: 14,
    paddingTop: 8,
  },
  logo: {
    borderCurve: 'continuous',
    borderRadius: 12,
    height: 44,
    overflow: 'hidden',
    width: 44,
  },
  menuItem: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: 10,
    paddingRight: 14,
    paddingVertical: 10,
    width: '100%',
  },
  menuItemIconContainer: {
    alignItems: 'center',
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  menuItemLarge: {
    alignItems: 'center',
    borderCurve: 'continuous',
    borderRadius: 30,
    borderWidth: IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
    height: 60,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingLeft: IS_ANDROID ? 12 : 12 - THICK_BORDER_WIDTH,
    paddingRight: IS_ANDROID ? 16 : 16 - THICK_BORDER_WIDTH,
    paddingVertical: IS_ANDROID ? 12 : 12 - THICK_BORDER_WIDTH,
    width: '100%',
  },
  menuItemSelected: {
    borderWidth: IS_ANDROID ? 0 : THICK_BORDER_WIDTH,
    paddingLeft: IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
    paddingRight: IS_ANDROID ? 14 : 14 - THICK_BORDER_WIDTH,
    paddingVertical: IS_ANDROID ? 10 : 10 - THICK_BORDER_WIDTH,
  },
  menuItemSelectedDark: {
    backgroundColor: globalColors.white10,
  },
  menuItemSelectedLight: {
    backgroundColor: '#F7F7F9',
  },
  panelContainer: {
    bottom: Math.max(safeAreaInsetValues.bottom + 5, IS_IOS ? 8 : 30),
    pointerEvents: 'box-none',
    position: 'absolute',
    zIndex: 30000,
  },
  panelBorder: {
    backgroundColor: 'transparent',
    borderCurve: 'continuous',
    borderRadius: 42 - 2 / 3,
    borderWidth: THICK_BORDER_WIDTH,
    height: '100%',
    overflow: 'hidden',
    position: 'absolute',
    width: '100%',
  },
  panelBorderContainer: {
    backgroundColor: 'transparent',
    borderColor: opacity(globalColors.grey100, 0.4),
    borderCurve: 'continuous',
    borderWidth: 2 / 3,
    borderRadius: 42,
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    position: 'absolute',
    width: '100%',
  },
  panel: {
    borderCurve: 'continuous',
    borderRadius: 42,
    overflow: 'hidden',
    width: deviceUtils.dimensions.width - 16,
  },
  panelBackgroundDark: {
    backgroundColor: '#191A1C',
  },
  panelBackgroundLight: {
    backgroundColor: globalColors.white100,
  },
});
