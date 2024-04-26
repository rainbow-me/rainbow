import chroma from 'chroma-js';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { GestureHandlerV1Button } from '@/__swaps__/screens/Swap/components/GestureHandlerV1Button';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { opacity, opacityWorklet } from '@/__swaps__/utils/swaps';
import { SmoothPager, usePagerNavigation } from '@/components/SmoothPager';
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
import { returnStringFirstEmoji } from '@/helpers/emojiHandler';
import { useAccountAccentColor, useAccountSettings, useWalletsWithBalancesAndNames } from '@/hooks';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { Network } from '@/networks/types';
import { useBrowserStore } from '@/state/browser/browserStore';
import { colors } from '@/styles';
import { deviceUtils } from '@/utils';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';
import { TOP_INSET } from '../Dimensions';
import { formatUrl } from '../utils';
import { RouteProp, useRoute } from '@react-navigation/native';
import { Address, toHex } from 'viem';
import { RainbowNetworks } from '@/networks';
import * as i18n from '@/languages';
import { convertAmountToNativeDisplay } from '@/helpers/utilities';
import { useSelector } from 'react-redux';
import store, { AppState } from '@/redux/store';
import { getDappHost } from '@/utils/connectedApps';
import { handleDappBrowserConnectionPrompt } from '@/utils/requestNavigationHandlers';
import { useAppSessionsStore } from '@/state/appSessions';
import { RainbowError, logger } from '@/logger';
import WebView from 'react-native-webview';

const PAGES = {
  HOME: 'home',
  SWITCH_WALLET: 'switch-wallet',
  SWITCH_NETWORK: 'switch-network',
};

type ControlPanelParams = {
  ControlPanel: {
    activeTabRef: React.MutableRefObject<WebView | null>;
  };
};

export const ControlPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();
  const { accountAddress } = useAccountSettings();
  const {
    params: { activeTabRef },
  } = useRoute<RouteProp<ControlPanelParams, 'ControlPanel'>>();
  const [isConnected, setIsConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState<string>(accountAddress);
  const [currentNetwork, setCurrentNetwork] = useState<Network>(RainbowNetworks[0].value);

  const nativeCurrency = useSelector((state: AppState) => state.settings.nativeCurrency);
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();
  const activeTabUrl = useBrowserStore(state => state.getActiveTabUrl());
  const activeTabHost = getDappHost(activeTabUrl as string);
  const updateActiveSession = useAppSessionsStore(state => state.updateActiveSession);
  const updateActiveSessionNetwork = useAppSessionsStore(state => state.updateActiveSessionNetwork);
  const addSession = useAppSessionsStore(state => state.addSession);
  const removeSession = useAppSessionsStore(state => state.removeSession);
  const getActiveSession = useAppSessionsStore(state => state.getActiveSession);
  const currentSession = getActiveSession({ host: activeTabHost });

  // listens to the current active tab and sets the account
  useEffect(() => {
    if (activeTabHost) {
      if (!currentSession) {
        setIsConnected(false);
        return;
      }

      if (currentSession?.address) {
        setCurrentAddress(currentSession?.address);
        setIsConnected(true);
      } else {
        setCurrentAddress(accountAddress);
      }

      if (currentSession?.network) {
        setCurrentNetwork(currentSession?.network);
      }
    }
  }, [accountAddress, activeTabHost, currentSession]);

  const allWalletItems = useMemo(() => {
    const items: ControlPanelMenuItemProps[] = [];
    Object.keys(walletsWithBalancesAndNames).forEach(key => {
      const wallet = walletsWithBalancesAndNames[key];
      const filteredAccounts = wallet.addresses.filter(account => account.visible);
      filteredAccounts.forEach(account => {
        const walletBalance = account.balance === '0.00' ? '0' : account.balance;
        const nativeCurrencyBalance = convertAmountToNativeDisplay(walletBalance || '0', nativeCurrency);

        const item = {
          IconComponent: account.image ? (
            <ListAvatar url={account.image || ''} />
          ) : (
            <ListEmojiAvatar address={account.address} color={account.color} label={account.label} />
          ),
          label: account.label,
          secondaryLabel: nativeCurrencyBalance,
          uniqueId: account.address,
          color: colors.avatarBackgrounds[account.color],
          selected: account.address === currentAddress,
        };

        items.push(item);
      });
    });

    return items;
  }, [walletsWithBalancesAndNames, currentAddress, nativeCurrency]);

  const { testnetsEnabled } = store.getState().settings;

  const allNetworkItems = useMemo(() => {
    return RainbowNetworks.filter(({ networkType }) => testnetsEnabled || networkType !== 'testnet').map(network => {
      return {
        IconComponent: <ChainImage chain={network.value} size={36} />,
        label: network.name,
        secondaryLabel: i18n.t(
          isConnected && network.value === currentNetwork
            ? i18n.l.dapp_browser.control_panel.connected
            : i18n.l.dapp_browser.control_panel.not_connected
        ),
        uniqueId: network.value,
        selected: network.value === currentNetwork,
      };
    });
  }, [currentNetwork, isConnected, testnetsEnabled]);

  const selectedWallet = allWalletItems.find(item => item.selected);

  const animatedAccentColor = useSharedValue(selectedWallet?.color || globalColors.blue10);
  const selectedNetworkId = useSharedValue(currentNetwork?.toString() || RainbowNetworks[0].value);
  const selectedWalletId = useSharedValue(selectedWallet?.uniqueId || accountAddress);

  console.log(
    JSON.stringify(
      {
        selectedNetworkId: selectedNetworkId.value,
        selectedWalletId: selectedWalletId.value,
        isConnected,
        currentAddress,
        currentNetwork,
      },
      null,
      2
    )
  );

  const handleSwitchWallet = useCallback(
    (selectedItemId: string) => {
      const address = selectedItemId;
      updateActiveSession({ host: activeTabHost, address: address as `0x${string}` });
      // need to emit these events to the dapp
      activeTabRef.current?.injectJavaScript(`window.ethereum.emit('accountsChanged', ['${address}']); true;`);
      setCurrentAddress(address);
    },
    [activeTabHost, activeTabRef, updateActiveSession]
  );

  const handleNetworkSwitch = useCallback(
    (selectedItemId: string) => {
      updateActiveSessionNetwork({ host: activeTabHost, network: selectedItemId as Network });
      const chainId = RainbowNetworks.find(({ value }) => value === (selectedItemId as Network))?.id as number;
      activeTabRef.current?.injectJavaScript(`window.ethereum.emit('chainChanged', ${toHex(chainId)}); true;`);
      setCurrentNetwork(selectedItemId as Network);
    },
    [activeTabHost, activeTabRef, updateActiveSessionNetwork]
  );

  const handleConnect = useCallback(async () => {
    const activeTabHost = getDappHost(activeTabUrl as string);
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    const name: string = activeTabRef.current?.title || activeTabHost;

    const response = await handleDappBrowserConnectionPrompt({
      dappName: name || '',
      dappUrl: activeTabUrl || '' || '',
    });

    if (!(response instanceof Error)) {
      const connectedToNetwork = getNetworkFromChainId(response.chainId);
      addSession({
        host: activeTabHost || '',
        // @ts-ignore
        address: response.address,
        network: connectedToNetwork,
        // @ts-ignore
        url: activeTabUrl || '',
      });

      const selectedAddress = selectedWalletId.value;

      activeTabRef.current?.injectJavaScript(
        `window.ethereum.emit('accountsChanged', ['${selectedAddress}']); window.ethereum.emit('connect', { address: '${selectedAddress}', chainId: '${toHex(response.chainId)}' }); true;`
      );
      setIsConnected(true);
      setCurrentAddress(selectedAddress);
      setCurrentNetwork(connectedToNetwork);
    } else {
      logger.error(new RainbowError('Dapp browser connection prompt error'), {
        response,
        dappName: name,
        dappUrl: activeTabUrl,
      });
    }
  }, [activeTabRef, activeTabUrl, addSession, selectedWalletId.value]);

  const handleDisconnect = useCallback(() => {
    const selectedAddress = selectedWalletId.value;

    const activeTabHost = getDappHost(activeTabUrl as string);
    if (activeTabHost) {
      removeSession({ host: activeTabHost, address: selectedAddress as Address });
      activeTabRef.current?.injectJavaScript(`window.ethereum.emit('accountsChanged', []); window.ethereum.emit('disconnect', []); true;`);
      setIsConnected(false);
    }
  }, [activeTabRef, activeTabUrl, removeSession, selectedWalletId.value]);

  return (
    <>
      <AccentColorSetter animatedAccentColor={animatedAccentColor} />
      <Box style={controlPanelStyles.panelContainer}>
        <SmoothPager initialPage={PAGES.HOME} ref={ref}>
          <SmoothPager.Page
            component={
              <HomePanel
                animatedAccentColor={animatedAccentColor}
                goToPage={goToPage}
                selectedNetwork={currentNetwork}
                selectedWallet={currentAddress}
                allWalletItems={allWalletItems}
                allNetworkItems={allNetworkItems}
                isConnected={isConnected}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
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
                  selectedWalletId={selectedWalletId}
                  onWalletSwitch={handleSwitchWallet}
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
                  selectedNetworkId={selectedNetworkId}
                  onNetworkSwitch={handleNetworkSwitch}
                />
              }
              id={PAGES.SWITCH_NETWORK}
            />
          </SmoothPager.Group>
        </SmoothPager>
      </Box>
    </>
  );
};

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

const AccentColorSetter = ({ animatedAccentColor }: { animatedAccentColor: SharedValue<string | undefined> }) => {
  // This component isolates the re-renders caused by the accentColor from the rest of the control panel to prevent
  // the control panel from re-rendering due to changes in the accentColor. It achieves this by transferring the
  // color to the provided shared value, which is then used to distribute the color throughout the control panel.
  const { accentColor } = useAccountAccentColor();
  const { isDarkMode } = useColorMode();

  const highContrastAccentColor = useMemo(() => getHighContrastAccentColor(accentColor, isDarkMode), [accentColor, isDarkMode]);

  useSyncSharedValue({
    sharedValue: animatedAccentColor,
    state: highContrastAccentColor,
    syncDirection: 'stateToSharedValue',
  });

  return null;
};

const HomePanel = ({
  animatedAccentColor,
  goToPage,
  selectedNetwork,
  selectedWallet,
  allWalletItems,
  allNetworkItems,
  isConnected,
  onConnect,
  onDisconnect,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goToPage: (pageId: string) => void;
  selectedNetwork: string;
  selectedWallet: string;
  allWalletItems: ControlPanelMenuItemProps[];
  allNetworkItems: ControlPanelMenuItemProps[];
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  const actionButtonList = useMemo(() => {
    const walletIcon = allWalletItems.find(item => item.uniqueId === selectedWallet)?.IconComponent || <></>;
    const walletLabel = allWalletItems.find(item => item.uniqueId === selectedWallet)?.label || '';
    const walletSecondaryLabel = allWalletItems.find(item => item.uniqueId === selectedWallet)?.secondaryLabel || '';

    const network = allNetworkItems.find(item => item.uniqueId === selectedNetwork);
    const networkIcon = <ChainImage chain={(network?.uniqueId as Network) || 'mainnet'} size={36} />;
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
  }, [allNetworkItems, allWalletItems, animatedAccentColor, goToPage, selectedNetwork, selectedWallet]);

  return (
    <Panel height={334}>
      <Box style={controlPanelStyles.homePanel}>
        <Stack space="24px">
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
          <Box paddingHorizontal="8px" width="full">
            <Inline alignHorizontal="justify" alignVertical="center">
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀖅"
                label={i18n.t(i18n.l.dapp_browser.control_panel.swap)}
                onPress={() => {
                  return;
                }}
              />
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀄹"
                label={i18n.t(i18n.l.dapp_browser.control_panel.bridge)}
                onPress={() => {
                  return;
                }}
              />
              <ConnectButton
                animatedAccentColor={animatedAccentColor}
                isConnected={isConnected}
                onConnect={onConnect}
                onDisconnect={onDisconnect}
              />
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀍡"
                label={i18n.t(i18n.l.dapp_browser.control_panel.more)}
                onPress={() => {
                  return;
                }}
              />
            </Inline>
          </Box>
          {actionButtonList}
        </Stack>
      </Box>
    </Panel>
  );
};

const HomePanelLogo = React.memo(function HomePanelLogo() {
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
      style={{ borderRadius: 12 }}
    />
  );
});

const HomePanelTitleSection = React.memo(function HomePanelTitleSection() {
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

const SwitchWalletPanel = ({
  animatedAccentColor,
  goBack,
  selectedWalletId,
  allWalletItems,
  onWalletSwitch,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  selectedWalletId: SharedValue<string>;
  allWalletItems: ControlPanelMenuItemProps[];
  onWalletSwitch: (selectedItemId: string) => void;
}) => {
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
      selectedItemId={selectedWalletId}
      onSelect={handleOnSelect}
    />
  );
};

const SwitchNetworkPanel = ({
  animatedAccentColor,
  goBack,
  selectedNetworkId,
  allNetworkItems,
  onNetworkSwitch,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  selectedNetworkId: SharedValue<string>;
  allNetworkItems: ControlPanelMenuItemProps[];
  onNetworkSwitch: (selectedItemId: string) => void;
}) => {
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
};

const LIST_SCROLL_INDICATOR_BOTTOM_INSET = { bottom: 42 };

const ListPanel = ({
  animatedAccentColor,
  goBack,
  items,
  pageTitle,
  selectedItemId,
  onSelect,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  items?: ControlPanelMenuItemProps[];
  pageTitle: string;
  selectedItemId: SharedValue<string>;
  onSelect: (selectedItemId: string) => void;
}) => {
  const memoizedItems = useMemo(() => items, [items]);

  return (
    <Panel>
      <Box style={controlPanelStyles.listPanel}>
        <ListHeader animatedAccentColor={animatedAccentColor} goBack={goBack} title={pageTitle} />
        <ScrollView
          contentContainerStyle={controlPanelStyles.listScrollViewContentContainer}
          scrollIndicatorInsets={LIST_SCROLL_INDICATOR_BOTTOM_INSET}
          style={controlPanelStyles.listScrollView}
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

const ListHeader = React.memo(function ListHeader({
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
    };
  });

  return (
    <Box style={controlPanelStyles.listHeader}>
      <Box style={controlPanelStyles.listHeaderContent}>
        <ButtonPressAnimation onPress={goBack} scaleTo={0.8} style={controlPanelStyles.listHeaderButtonWrapper}>
          <Box alignItems="center" height={{ custom: 20 }} justifyContent="center" width={{ custom: 20 }}>
            <AnimatedText align="center" size="icon 20px" staticText="􀆉" style={backIconStyle} weight="bold" />
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
  color?: string;
  onPress?: () => void;
  secondaryLabel?: string;
  secondaryLabelColor?: TextColor;
  selected?: boolean;
  selectedItemId?: SharedValue<string>;
  uniqueId: string;
  variant?: 'homePanel';
}

const ControlPanelMenuItem = React.memo(function ControlPanelMenuItem({
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

    // const walletColor = PLACEHOLDER_WALLET_ITEMS.find(item => item.uniqueId === uniqueId)?.color;
    // if (walletColor && animatedAccentColor) {
    //   animatedAccentColor.value = withTiming(walletColor, TIMING_CONFIGS.slowFadeConfig);
    // }

    onPress?.();
  }, [/* animatedAccentColor, */ onPress, selectedItemId, uniqueId]);

  const selectedStyle = useAnimatedStyle(() => {
    const selected = selectedItemId?.value === uniqueId || variant === 'homePanel';
    return {
      // eslint-disable-next-line no-nested-ternary
      backgroundColor: selected ? (isDarkMode ? globalColors.white10 : '#FBFCFD') : 'transparent',
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
      fontWeight: selected || variant === 'homePanel' ? '700' : '600',
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
            <AnimatedText numberOfLines={1} size="17pt" staticText={label} style={selectedTextStyle} />
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
                <AnimatedText align="center" size="icon 17px" staticText="􀆊" style={selectedTextStyle} weight="heavy" />
              </Box>
            </Column>
          )}
        </Columns>
      </Animated.View>
    </ButtonPressAnimation>
  );
});

const ListAvatar = React.memo(function ListAvatar({ size = 36, url }: { size?: number; url: string }) {
  return (
    <ImgixImage enableFasterImage size={size ?? 36} source={{ uri: url }} style={{ borderRadius: size / 2, height: size, width: size }} />
  );
});

const ListEmojiAvatar = React.memo(function ListEmojiAvatar({
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

const ControlPanelButton = React.memo(function ControlPanelButton({
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
            <AnimatedText align="center" color="label" size="icon 20px" staticText={icon} style={buttonTextColor} weight="heavy" />
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

const ConnectButton = React.memo(function ControlPanelButton({
  // animatedAccentColor,
  isConnected,
  onConnect,
  onDisconnect,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  isConnected: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const buttonColor = useDerivedValue(() => {
    return withTiming(isConnected ? red : green, TIMING_CONFIGS.slowerFadeConfig);
    // if (!isConnected.value || !animatedAccentColor.value)
    //   return withTiming(isConnected.value ? red : green, TIMING_CONFIGS.slowerFadeConfig);
    // return animatedAccentColor.value;
  });

  const buttonIcon = useDerivedValue(() => {
    return isConnected ? '􀋪' : '􀋦';
  });
  const buttonLabel = useDerivedValue(() => {
    return isConnected ? 'Disconnect' : 'Connect';
  });

  const buttonBackground = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(buttonColor.value, 0.16),
      borderColor: IS_IOS ? opacityWorklet(buttonColor.value, 0.08) : undefined,
    };
  });
  const buttonIconStyle = useAnimatedStyle(() => {
    return {
      color: buttonColor.value,
      textShadowColor: opacityWorklet(buttonColor.value, 0.8),
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
    <GestureHandlerV1Button
      buttonPressWrapperStyleIOS={controlPanelStyles.connectButtonContainer}
      onPressWorklet={handlePress}
      pointerEvents="auto"
      scaleTo={0.82}
      style={[controlPanelStyles.buttonContainer]}
    >
      <Box paddingHorizontal={IS_IOS ? '16px' : undefined} paddingVertical={IS_IOS ? '10px' : undefined}>
        <Stack alignHorizontal="center" space="10px">
          <Box as={Animated.View} style={[controlPanelStyles.button, controlPanelStyles.connectButton, buttonBackground]}>
            <Bleed space="16px">
              <AnimatedText align="center" size="icon 20px" style={[buttonIconStyle, controlPanelStyles.connectButtonIcon]} weight="heavy">
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
    </GestureHandlerV1Button>
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
    backgroundColor: '#FBFCFD',
  },
  panelContainer: {
    bottom: 91,
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
