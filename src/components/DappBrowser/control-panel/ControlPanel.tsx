import chroma from 'chroma-js';
import { isEmpty } from 'lodash';
import React, { useCallback, useMemo, useState } from 'react';
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
import { ChainId } from '@/__swaps__/types/chains';
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
import { removeFirstEmojiFromString, returnStringFirstEmoji } from '@/helpers/emojiHandler';
import networkTypes from '@/helpers/networkTypes';
import { useAccountAccentColor, useAccountSettings, useWalletsWithBalancesAndNames } from '@/hooks';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { Network } from '@/networks/types';
// import { useBrowserStore } from '@/state/browser/browserStore';
import { colors } from '@/styles';
import { deviceUtils } from '@/utils';
import { address } from '@/utils/abbreviations';
import { getNetworkFromChainId } from '@/utils/ethereumUtils';
import { addressHashedEmoji } from '@/utils/profileUtils';
import { TOP_INSET } from '../Dimensions';
import { getHighContrastTextColorWorklet } from '@/worklets/colors';

const PAGES = {
  HOME: 'home',
  SWITCH_WALLET: 'switch-wallet',
  SWITCH_NETWORK: 'switch-network',
};

export const ControlPanel = () => {
  const { goBack, goToPage, ref } = usePagerNavigation();

  const animatedAccentColor = useSharedValue(PLACEHOLDER_WALLET_ITEMS[0].color);
  const selectedNetworkId = useSharedValue(PLACEHOLDER_CHAIN_ITEMS[0].uniqueId);
  const selectedWalletId = useSharedValue(PLACEHOLDER_WALLET_ITEMS[0].uniqueId);

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
                selectedNetworkId={selectedNetworkId}
                selectedWalletId={selectedWalletId}
              />
            }
            id={PAGES.HOME}
          />
          <SmoothPager.Group>
            <SmoothPager.Page
              component={
                <SwitchWalletPanel animatedAccentColor={animatedAccentColor} goBack={goBack} selectedWalletId={selectedWalletId} />
              }
              id={PAGES.SWITCH_WALLET}
            />
            <SmoothPager.Page
              component={
                <SwitchNetworkPanel animatedAccentColor={animatedAccentColor} goBack={goBack} selectedNetworkId={selectedNetworkId} />
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
  selectedNetworkId,
  selectedWalletId,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goToPage: (pageId: string) => void;
  selectedNetworkId: SharedValue<string>;
  selectedWalletId: SharedValue<string>;
}) => {
  const [selectedItems, setSelectedStates] = useState({
    selectedWalletId: PLACEHOLDER_WALLET_ITEMS[0].uniqueId,
    selectedNetworkId: PLACEHOLDER_CHAIN_ITEMS[0].uniqueId,
  });

  useAnimatedReaction(
    () => ({ selectedWalletId: selectedWalletId.value, selectedNetworkId: selectedNetworkId.value }),
    (current, previous) => {
      const didSelectedWalletChange = previous?.selectedWalletId && current.selectedWalletId !== previous.selectedWalletId;
      const didSelectedNetworkChange = previous?.selectedNetworkId && current.selectedNetworkId !== previous.selectedNetworkId;

      if (didSelectedWalletChange || didSelectedNetworkChange) {
        runOnJS(setSelectedStates)(current);
      }
    }
  );

  const actionButtonList = useMemo(() => {
    const walletIcon = PLACEHOLDER_WALLET_ITEMS.find(item => item.uniqueId === selectedItems.selectedWalletId)?.IconComponent || <></>;
    const walletLabel = PLACEHOLDER_WALLET_ITEMS.find(item => item.uniqueId === selectedItems.selectedWalletId)?.label || '';
    const walletSecondaryLabel =
      PLACEHOLDER_WALLET_ITEMS.find(item => item.uniqueId === selectedItems.selectedWalletId)?.secondaryLabel || '';

    const networkIcon = <ChainImage chain={getNetworkFromChainId(Number(selectedItems.selectedNetworkId))} size={36} />;
    const networkLabel = PLACEHOLDER_CHAIN_ITEMS.find(item => item.uniqueId === selectedItems.selectedNetworkId)?.label || '';
    const networkSecondaryLabel =
      PLACEHOLDER_CHAIN_ITEMS.find(item => item.uniqueId === selectedItems.selectedNetworkId)?.secondaryLabel || '';

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
  }, [animatedAccentColor, goToPage, selectedItems.selectedNetworkId, selectedItems.selectedWalletId]);

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
                <Stack space="12px">
                  <Text color="label" size="20pt" weight="heavy">
                    Speedtracer
                  </Text>
                  <Text color="labelTertiary" size="15pt" weight="bold">
                    speedtracer.xyz
                  </Text>
                </Stack>
              </Column>
            </Columns>
          </Box>
          <Box paddingHorizontal="8px" width="full">
            <Inline alignHorizontal="justify" alignVertical="center">
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀖅"
                label="Swap"
                onPress={() => {
                  return;
                }}
              />
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀄹"
                label="Bridge"
                onPress={() => {
                  return;
                }}
              />
              <ConnectButton animatedAccentColor={animatedAccentColor} initialIsConnected={false} />
              <ControlPanelButton
                animatedAccentColor={animatedAccentColor}
                icon="􀍡"
                label="More"
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

const HomePanelLogo = () => {
  // const logoUrl = useBrowserStore(state => state.getActiveTabLogo());
  // const activeTabId = useBrowserStore(state => state.activeTabId);
  // const url = useBrowserStore(state => state.getTabData(activeTabId)?.logoUrl);
  // const logoUrl = useBrowserStore(state => state.getTabData(state.tabIds[state.activeTabIndex]).logoUrl);
  return (
    <>
      {/* <Text color="blue" size="20pt" weight="heavy">
        {url}
      </Text> */}
      <Box
        as={ImgixImage}
        enableFasterImage
        fm="png"
        size={44}
        source={{ uri: 'https://speedtracer.xyz/apple-touch-icon.png' }}
        // source={{ uri: url || '' }}
        width={{ custom: 44 }}
        height={{ custom: 44 }}
        background="fillTertiary"
        style={{ borderRadius: 12 }}
      />
    </>
  );
};

const SwitchWalletPanel = ({
  animatedAccentColor,
  goBack,
  selectedWalletId,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  selectedWalletId: SharedValue<string>;
}) => {
  const { network } = useAccountSettings();
  const walletsWithBalancesAndNames = useWalletsWithBalancesAndNames();

  const memoizedItems = useMemo(() => {
    if (isEmpty(walletsWithBalancesAndNames)) return;
    const items: ControlPanelMenuItemProps[] = [];

    Object.values(walletsWithBalancesAndNames).forEach(wallet => {
      const filteredAccounts = wallet.addresses.filter(account => account.visible);
      filteredAccounts.forEach(account => {
        const rawWalletName =
          network !== networkTypes.mainnet && account.ens === account.label ? address(account.address, 6, 4) : account.label;
        const walletName = removeFirstEmojiFromString(rawWalletName);
        const walletBalance = account.balance === '0.00' ? '0' : account.balance;

        const item: ControlPanelMenuItemProps = {
          IconComponent: account.image ? (
            <ListAvatar url={account.image || ''} />
          ) : (
            <ListEmojiAvatar address={account.address} color={account.color} label={account.label} />
          ),
          label: walletName,
          secondaryLabel: `${walletBalance} ETH`,
          uniqueId: account.address,
        };

        items.push(item);
      });
    });

    return items || [];
  }, [network, walletsWithBalancesAndNames]);

  return (
    <ListPanel
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={memoizedItems}
      pageTitle="Switch Wallet"
      selectedItemId={selectedWalletId}
    />
  );
};

const SwitchNetworkPanel = ({
  animatedAccentColor,
  goBack,
  selectedNetworkId,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  selectedNetworkId: SharedValue<string>;
}) => {
  return (
    <ListPanel
      animatedAccentColor={animatedAccentColor}
      goBack={goBack}
      items={PLACEHOLDER_CHAIN_ITEMS}
      pageTitle="Switch Network"
      selectedItemId={selectedNetworkId}
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
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  goBack: () => void;
  items?: ControlPanelMenuItemProps[];
  pageTitle: string;
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
          style={controlPanelStyles.listScrollView}
        >
          <Box width="full">
            {memoizedItems?.map(item => (
              <ControlPanelMenuItem
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...item}
                animatedAccentColor={animatedAccentColor}
                key={item.uniqueId}
                onPress={goBack}
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
  onPress?: () => void;
  secondaryLabel?: string;
  secondaryLabelColor?: TextColor;
  // selected?: boolean;
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
  initialIsConnected,
  onConnect,
  onDisconnect,
}: {
  animatedAccentColor: SharedValue<string | undefined>;
  initialIsConnected: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  const green = useForegroundColor('green');
  const red = useForegroundColor('red');

  const isConnected = useSharedValue(initialIsConnected);
  const buttonColor = useDerivedValue(() => {
    return withTiming(isConnected.value ? red : green, TIMING_CONFIGS.slowerFadeConfig);
    // if (!isConnected.value || !animatedAccentColor.value)
    //   return withTiming(isConnected.value ? red : green, TIMING_CONFIGS.slowerFadeConfig);
    // return animatedAccentColor.value;
  });

  const buttonIcon = useDerivedValue(() => {
    return isConnected.value ? '􀋪' : '􀋦';
  });
  const buttonLabel = useDerivedValue(() => {
    return isConnected.value ? 'Disconnect' : 'Connect';
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
    if (isConnected.value) {
      isConnected.value = false;
      if (onDisconnect) {
        runOnJS(onDisconnect)();
      }
    } else {
      isConnected.value = true;
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

const PLACEHOLDER_CHAIN_ITEMS = [
  {
    IconComponent: <ChainImage chain={Network.base} size={36} />,
    label: 'Base',
    secondaryLabel: '$1,977.08',
    uniqueId: `${ChainId.base}`,
  },
  {
    IconComponent: <ChainImage chain={Network.mainnet} size={36} />,
    label: 'Ethereum',
    secondaryLabel: '$1,500.56',
    uniqueId: `${ChainId.mainnet}`,
  },
  {
    IconComponent: <ChainImage chain={Network.optimism} size={36} />,
    label: 'Optimism',
    secondaryLabel: '$420.52',
    uniqueId: `${ChainId.optimism}`,
  },
  {
    IconComponent: <ChainImage chain={Network.blast} size={36} />,
    label: 'Blast',
    secondaryLabel: '$1,240.16',
    uniqueId: `${ChainId.blast}`,
  },
  {
    IconComponent: <ChainImage chain={Network.zora} size={36} />,
    label: 'Zora',
    secondaryLabel: '$720.10',
    uniqueId: `${ChainId.zora}`,
  },
];

const PLACEHOLDER_WALLET_ITEMS = [
  {
    IconComponent: (
      <ListAvatar url="https://lh3.googleusercontent.com/CtQeWROprYWCnbGW0Rbcf27IPo-X5bUdztwBUldp-fnpvIsbf4ZpU79Ty2e7Sjl6hI9xgf_6d7ZW5QGuF4Ex6nYmoG0XrLs3hQw=s250" />
    ),
    color: '#FEBD01',
    label: 'maximillian.eth',
    secondaryLabel: '$16,858.42',
    selected: true,
    uniqueId: '0x26C50C986E4006759248b644856178bdD43D4caa',
  },
  {
    IconComponent: <ListAvatar url="https://zora.co/api/avatar/timmmy.eth?size=180" />,
    color: '#D85341',
    label: 'timmmy.eth',
    secondaryLabel: '$2,420.52',
    uniqueId: '0x1234',
  },
  {
    IconComponent: <ListAvatar url="https://pbs.twimg.com/profile_images/1557391177665708032/FSuv7Zpo_400x400.png" />,
    color: '#3D7EFF',
    label: 'rainbow.eth',
    secondaryLabel: '$1,960.26',
    uniqueId: '0x12345',
  },
  {
    IconComponent: <ListAvatar url="https://zora.co/api/avatar/jacob.eth?size=180" />,
    color: '#268FFF',
    label: 'jacob.eth',
    secondaryLabel: '$8,240.02',
    uniqueId: '0x123456',
  },
  {
    IconComponent: <ListAvatar url="https://zora.co/api/avatar/callil.eth?size=180" />,
    color: '#8FFF57',
    label: 'callil.eth',
    secondaryLabel: '$4,921.02',
    uniqueId: '0x1234567',
  },
];
