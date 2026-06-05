import React, { memo, useCallback, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { InteractionManager, Platform, StyleSheet, View } from 'react-native';

import MaskedView from '@react-native-masked-view/masked-view';
import { createMaterialTopTabNavigator, type MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import {
  type MaterialTopTabBarProps,
  type MaterialTopTabDescriptorMap,
  type MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { type NavigationHelpers, type ParamListBase, type RouteProp } from '@react-navigation/native';
import ConditionalWrap from 'conditional-wrap';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
  type DerivedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { initialWindowMetrics } from 'react-native-safe-area-context';

import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import ButtonPressAnimation from '@/components/animations/ButtonPressAnimation';
import { AssetUpdateTransactionWatcher } from '@/components/asset-update-transaction-watcher/AssetUpdateTransactionWatcher';
import { BlurGradient } from '@/components/blur/BlurGradient';
import { BrowserTabBarContextProvider, useBrowserTabBarContext } from '@/components/DappBrowser/BrowserContext';
import { BROWSER_BACKGROUND_COLOR_DARK, BROWSER_BACKGROUND_COLOR_LIGHT } from '@/components/DappBrowser/constants';
import { DappBrowser } from '@/components/DappBrowser/DappBrowser';
import { discoverOpenSearchFnRef, discoverScrollToTopFnRef } from '@/components/Discover/DiscoverScreenContext';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { FlexItem } from '@/components/layout';
import { PendingTransactionWatcher } from '@/components/pending-transaction-watcher/PendingTransactionWatcher';
import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { ActivityTabIcon } from '@/components/tab-bar/ActivityTabIcon';
import { BrowserTabIcon } from '@/components/tab-bar/BrowserTabIcon';
import {
  TAB_BAR_HORIZONTAL_INSET,
  TAB_BAR_INNER_PADDING,
  TAB_BAR_PILL_HEIGHT,
  TAB_BAR_PILL_WIDTH,
  TAB_BAR_WIDTH,
} from '@/components/tab-bar/dimensions';
import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import { DAPP_BROWSER, LAZY_TABS, RNBW_MEMBERSHIP, RNBW_REWARDS } from '@/config/experimental';
import useExperimentalFlag from '@/config/experimentalHooks';
import { Box, ColorModeProvider, Column, Columns, globalColors, useColorMode } from '@/design-system';
import { IS_TEST } from '@/env';
import { useShowKingOfTheHill } from '@/features/king-of-the-hill/hooks/useShowKingOfTheHill';
import { KingOfTheHillScreen } from '@/features/king-of-the-hill/screens/KingOfTheHillScreen';
import { RnbwMembershipScreen } from '@/features/rnbw-membership/screens/rnbw-membership-screen/RnbwMembershipScreen';
import { RnbwRewardsScreen } from '@/features/rnbw-rewards/screens/rnbw-rewards-screen/RnbwRewardsScreen';
import { opacity } from '@/framework/ui/utils/opacity';
import { useAccountAccentColor } from '@/hooks/useAccountAccentColor';
import useAccountSettings from '@/hooks/useAccountSettings';
import useDimensions from '@/hooks/useDimensions';
import { useRemoteConfig } from '@/model/remoteConfig';
import { BASE_TAB_BAR_HEIGHT } from '@/navigation/constants';
import {
  RecyclerListViewScrollToTopProvider,
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import { DiscoverScreen } from '@/screens/DiscoverScreen';
import WalletScreen from '@/screens/WalletScreen/WalletScreen';
import { useBrowserStore } from '@/state/browser/browserStore';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { setActiveRoute, useNavigationStore } from '@/state/navigation/navigationStore';
import { darkModeThemeColors, lightModeThemeColors } from '@/styles/colors';
import { THICK_BORDER_WIDTH } from '@/styles/constants';
import deviceUtils, { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';

import ProfileScreen from '../screens/ProfileScreen';
import { MainListProvider, useMainList } from './MainListContext';
import Routes, { type Route } from './routesNames';

export const TAB_BAR_HEIGHT = getTabBarHeight();

function getTabBarHeight() {
  return BASE_TAB_BAR_HEIGHT + (initialWindowMetrics?.insets.bottom ?? 0) + 6;
}

const DOUBLE_PRESS_DELAY = 400;
const TAB_BAR_BORDER_RADIUS = BASE_TAB_BAR_HEIGHT / 2;

const TAB_BAR_ICONS = {
  [Routes.WALLET_SCREEN]: 'tabHome',
  [Routes.DISCOVER_SCREEN]: 'tabDiscover',
  [Routes.DAPP_BROWSER_SCREEN]: 'tabDappBrowser',
  [Routes.PROFILE_SCREEN]: 'tabActivity',
  [Routes.KING_OF_THE_HILL]: 'tabKingOfTheHill',
  [Routes.RNBW_MEMBERSHIP_SCREEN]: 'tabMembership',
  [Routes.RNBW_REWARDS_SCREEN]: 'tabPoints',
} as const;

type TabIconKey = (typeof TAB_BAR_ICONS)[keyof typeof TAB_BAR_ICONS];

type TabBarProps = {
  activeIndex: DerivedValue<number>;
  descriptorsRef: MutableRefObject<MaterialTopTabDescriptorMap>;
  getIsFocused: (index: number) => boolean;
  jumpTo: (key: string) => void;
  navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
  stateRef: MutableRefObject<{ index: number; routes: RouteProp<ParamListBase, string>[] }>;
};

const TabBar = memo(function TabBar({ activeIndex, descriptorsRef, getIsFocused, jumpTo, navigation, stateRef }: TabBarProps) {
  const { highContrastAccentColor: accentColor } = useAccountAccentColor();
  const { extraWebViewHeight, tabViewProgress } = useBrowserTabBarContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const recyclerList = useRecyclerListViewScrollToTopContext();
  const mainList = useMainList();

  const { dapp_browser, discover_enabled, rnbw_rewards_enabled, rnbw_membership_enabled } = useRemoteConfig(
    'dapp_browser',
    'discover_enabled',
    'rnbw_rewards_enabled',
    'rnbw_membership_enabled'
  );
  const showDiscoverTab = discover_enabled;
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showRnbwRewardsTab = useExperimentalFlag(RNBW_REWARDS) || rnbw_rewards_enabled;
  const showRnbwMembership = useExperimentalFlag(RNBW_MEMBERSHIP) || rnbw_membership_enabled || IS_TEST;
  const showRnbwRewardsOrMembershipTab = showRnbwRewardsTab || showRnbwMembership;
  const showKingOfTheHillTab = useShowKingOfTheHill();

  const numberOfTabs = 2 + (showDiscoverTab ? 1 : 0) + (showRnbwRewardsOrMembershipTab ? 1 : 0) + (showDappBrowserTab ? 1 : 0);
  const tabWidth = (deviceWidth - TAB_BAR_HORIZONTAL_INSET * 2 - TAB_BAR_INNER_PADDING * 2) / numberOfTabs;
  const tabPillStartPosition = (tabWidth - TAB_BAR_PILL_WIDTH) / 2 + TAB_BAR_INNER_PADDING;

  const reanimatedPosition = useSharedValue(0);
  const showBrowserNavButtons = useSharedValue(false);

  const tabRoutes = useDerivedValue<Route[]>(() => {
    const routes: Route[] = [Routes.WALLET_SCREEN];
    if (showDiscoverTab) routes.push(Routes.DISCOVER_SCREEN);
    if (showDappBrowserTab) routes.push(Routes.DAPP_BROWSER_SCREEN);
    routes.push(showKingOfTheHillTab ? Routes.KING_OF_THE_HILL : Routes.PROFILE_SCREEN);
    if (showRnbwRewardsOrMembershipTab) {
      routes.push(showRnbwMembership ? Routes.RNBW_MEMBERSHIP_SCREEN : Routes.RNBW_REWARDS_SCREEN);
    }
    return routes;
  }, [showDappBrowserTab, showDiscoverTab, showKingOfTheHillTab, showRnbwMembership, showRnbwRewardsOrMembershipTab]);

  const tabPositions = useDerivedValue(() => {
    const inputRange = Array.from({ length: numberOfTabs }, (_, index) => index);
    const outputRange = Array.from({ length: numberOfTabs }, (_, index) => tabPillStartPosition + tabWidth * index);
    return { inputRange, outputRange };
  });

  const backgroundPillStyle = useAnimatedStyle(() => {
    const route = tabRoutes.value[reanimatedPosition.value] ?? Routes.WALLET_SCREEN;
    const isDappBrowserTab = route === Routes.DAPP_BROWSER_SCREEN && showBrowserNavButtons.value;
    const backgroundOpacity = isDappBrowserTab ? 0 : 1;
    const translateX = interpolate(reanimatedPosition.value, tabPositions.value.inputRange, tabPositions.value.outputRange, 'clamp');

    return {
      backgroundColor: opacity(accentColor, (isDarkMode ? 0.2 : 0.1) * backgroundOpacity),
      transform: [{ translateX: withSpring(translateX, SPRING_CONFIGS.snappyMediumSpringConfig) }],
    };
  });

  const dappBrowserTabBarStyle = useAnimatedStyle(() => {
    const route = tabRoutes.value[reanimatedPosition.value] ?? Routes.WALLET_SCREEN;
    const shouldUseBrowserStyle = route === Routes.DAPP_BROWSER_SCREEN;
    return {
      opacity: withTiming(shouldUseBrowserStyle ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  const hideForBrowserTabViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress.value || 0;
    const opacity = 1 - progress / 75;
    const pointerEvents = extraWebViewHeight.value > 0 || opacity < 1 ? 'none' : 'auto';
    const baseWidth = DEVICE_WIDTH - TAB_BAR_HORIZONTAL_INSET * 2;

    return {
      opacity: opacity * (1 - extraWebViewHeight.value / 48),
      pointerEvents,
      transform: [
        {
          translateY: interpolate(progress, [0, 100], [0, 28]),
        },
        {
          translateY: extraWebViewHeight.value,
        },
      ],
      width: withSpring(
        showBrowserNavButtons.value ? baseWidth + (TAB_BAR_PILL_HEIGHT * 2 - TAB_BAR_PILL_WIDTH) : baseWidth,
        SPRING_CONFIGS.snappyMediumSpringConfig
      ),
    };
  });

  const lastPressRef = useRef<number | undefined>(undefined);

  useAnimatedReaction(
    () => activeIndex.value,
    (current, previous) => {
      if (current !== previous) {
        reanimatedPosition.value = current;
      }
    },
    []
  );

  const onPress = useCallback(
    ({ route, index, tabBarIcon }: { route: { key: string; name: string }; index: number; tabBarIcon: string }) => {
      const isFocused = getIsFocused(index);
      const time = new Date().getTime();
      const delta = time - (lastPressRef.current || 0);

      if (!isFocused) {
        reanimatedPosition.value = index;
        jumpTo(route.key);
        setActiveRoute(route.name as Route);
      } else {
        switch (tabBarIcon) {
          case TAB_BAR_ICONS[Routes.WALLET_SCREEN]:
            recyclerList.scrollToTop?.();
            break;
          case TAB_BAR_ICONS[Routes.DISCOVER_SCREEN]:
            if (delta < DOUBLE_PRESS_DELAY) {
              discoverOpenSearchFnRef?.();
              return;
            }
            if (discoverScrollToTopFnRef?.() === 0) {
              discoverOpenSearchFnRef?.();
              return;
            }
            break;
          case TAB_BAR_ICONS[Routes.PROFILE_SCREEN]:
            mainList?.scrollToTop();
            break;
          case TAB_BAR_ICONS[Routes.KING_OF_THE_HILL]:
            mainList?.scrollToTop();
            break;
        }
      }

      lastPressRef.current = time;
    },
    [getIsFocused, jumpTo, mainList, reanimatedPosition, recyclerList]
  );

  const onLongPress = useCallback(
    ({ route, tabBarIcon }: { route: { key: string }; tabBarIcon: string }) => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });

      switch (tabBarIcon) {
        case TAB_BAR_ICONS[Routes.WALLET_SCREEN]:
          navigation.navigate(Routes.CHANGE_WALLET_SHEET);
          break;
        case TAB_BAR_ICONS[Routes.DISCOVER_SCREEN]:
          navigation.navigate(Routes.DISCOVER_SCREEN);
          InteractionManager.runAfterInteractions(() => {
            discoverOpenSearchFnRef?.();
          });
          break;
      }
    },
    [navigation]
  );

  const renderedTabs = useMemo(
    () =>
      stateRef.current.routes.map((route: RouteProp<ParamListBase, string>, index: number) => {
        if (
          (!showDappBrowserTab && route.name === Routes.DAPP_BROWSER_SCREEN) ||
          (!showDiscoverTab && route.name === Routes.DISCOVER_SCREEN) ||
          (!showRnbwRewardsTab && route.name === Routes.RNBW_REWARDS_SCREEN) ||
          (!showRnbwMembership && route.name === Routes.RNBW_MEMBERSHIP_SCREEN)
        ) {
          return null;
        }
        const { options } = descriptorsRef.current[route.key];

        // This is a hack to avoid the built-in title type of string | undefined
        // options.title should never be undefined as long as a title is specified for each Swipe.Screen
        const tabBarIcon = options.title as TabIconKey;

        return tabBarIcon === TAB_BAR_ICONS[Routes.DAPP_BROWSER_SCREEN] ? (
          <Column key={route.name} width="content">
            <BrowserTabIconWrapper
              accentColor={accentColor}
              activeIndex={reanimatedPosition}
              index={index}
              onLongPress={onLongPress}
              onPress={onPress}
              route={route}
              showBrowserNavButtons={showBrowserNavButtons}
              tabBarIcon={tabBarIcon}
            />
          </Column>
        ) : (
          <BaseTabIcon
            key={route.name}
            accentColor={accentColor}
            activeIndex={reanimatedPosition}
            index={index}
            onLongPress={onLongPress}
            onPress={onPress}
            route={route}
            tabBarIcon={tabBarIcon}
          />
        );
      }),
    [
      accentColor,
      descriptorsRef,
      onLongPress,
      onPress,
      reanimatedPosition,
      showBrowserNavButtons,
      showDappBrowserTab,
      showDiscoverTab,
      showRnbwMembership,
      showRnbwRewardsTab,
      stateRef,
    ]
  );

  const shadowStyle = useAnimatedStyle(() => {
    const route = tabRoutes.value[reanimatedPosition.value] ?? Routes.WALLET_SCREEN;
    const isDappBrowserTab = route === Routes.DAPP_BROWSER_SCREEN;
    return {
      shadowOpacity: withSpring(isDarkMode ? 0.6 : isDappBrowserTab ? 0 : 0.16, SPRING_CONFIGS.snappyMediumSpringConfig),
    };
  });

  const gradientBackgroundStyle = useAnimatedStyle(() => {
    const route = tabRoutes.value[reanimatedPosition.value] ?? Routes.WALLET_SCREEN;
    return {
      backgroundColor: route === Routes.DAPP_BROWSER_SCREEN ? 'transparent' : getTabBackgroundColor(route, isDarkMode),
    };
  });

  const gradientVisibilityStyle = useAnimatedStyle(() => {
    const route = tabRoutes.value[reanimatedPosition.value] ?? Routes.WALLET_SCREEN;
    return {
      opacity: withTiming(route === Routes.RNBW_REWARDS_SCREEN ? 0 : 1, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  return (
    <>
      <Animated.View style={gradientVisibilityStyle}>
        <MaskedView
          maskElement={
            <EasingGradient
              easing={Easing.inOut(Easing.quad)}
              endColor={globalColors.grey100}
              endOpacity={0.92}
              startColor={globalColors.grey100}
              startOpacity={0}
              style={styles.tabBarBackgroundFade}
            />
          }
          style={styles.tabBarBackgroundFade}
        >
          <Animated.View style={[styles.tabBarBackgroundFade, gradientBackgroundStyle]} />
        </MaskedView>
      </Animated.View>
      <Animated.View style={[{ shadowColor: globalColors.grey100, shadowOffset: { width: 0, height: 12 }, shadowRadius: 18 }, shadowStyle]}>
        <Box
          as={Animated.View}
          borderColor={isDarkMode ? 'separatorSecondary' : { custom: 'rgba(255, 255, 255, 0.64)' }}
          borderWidth={THICK_BORDER_WIDTH}
          borderRadius={TAB_BAR_BORDER_RADIUS}
          bottom={{ custom: TAB_BAR_HEIGHT - BASE_TAB_BAR_HEIGHT }}
          height={{ custom: BASE_TAB_BAR_HEIGHT }}
          position="absolute"
          style={[hideForBrowserTabViewStyle, { alignSelf: 'center' }]}
        >
          <Box height={{ custom: BASE_TAB_BAR_HEIGHT }} width="full">
            {Platform.OS === 'ios' ? (
              <>
                <BlurGradient
                  gradientPoints={[
                    { x: 0.5, y: 1.2 },
                    { x: 0.5, y: 0 },
                  ]}
                  height={BASE_TAB_BAR_HEIGHT}
                  intensity={16}
                  saturation={1.5}
                  style={StyleSheet.absoluteFill}
                  width={TAB_BAR_WIDTH}
                />
                <LinearGradient
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  colors={
                    isDarkMode
                      ? ['rgba(57, 58, 64, 0.36)', 'rgba(57, 58, 64, 0.32)']
                      : ['rgba(255, 255, 255, 0.72)', 'rgba(255, 255, 255, 0.52)']
                  }
                  style={StyleSheet.absoluteFill}
                />
              </>
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? PANEL_COLOR_DARK : globalColors.white100 }]} />
            )}
            {isDarkMode && (
              <LinearGradient
                end={{ x: 0.5, y: 1 }}
                colors={['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0)']}
                start={{ x: 0.5, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <Box
              as={Animated.View}
              height="full"
              position="absolute"
              style={[
                dappBrowserTabBarStyle,
                { backgroundColor: isDarkMode ? BROWSER_BACKGROUND_COLOR_DARK : BROWSER_BACKGROUND_COLOR_LIGHT },
              ]}
              width="full"
            />
            <Box
              alignItems="center"
              as={Animated.View}
              borderRadius={TAB_BAR_BORDER_RADIUS - TAB_BAR_INNER_PADDING}
              height={{ custom: TAB_BAR_PILL_HEIGHT }}
              justifyContent="center"
              position="absolute"
              style={backgroundPillStyle}
              top={{ custom: TAB_BAR_INNER_PADDING }}
              width={{ custom: TAB_BAR_PILL_WIDTH }}
            />
            <Box paddingHorizontal={{ custom: TAB_BAR_INNER_PADDING }}>
              <Columns alignVertical="center">{renderedTabs}</Columns>
            </Box>
          </Box>
        </Box>
      </Animated.View>
    </>
  );
});

type BaseTabIconProps = {
  accentColor: string;
  activeIndex: SharedValue<number>;
  index: number;
  onLongPress: ({ route, tabBarIcon }: { route: { key: string; name: string }; tabBarIcon: TabIconKey }) => void;
  onPress: ({ route, index, tabBarIcon }: { route: { key: string; name: string }; index: number; tabBarIcon: TabIconKey }) => void;
  route: { key: string; name: string };
  tabBarIcon: TabIconKey;
};

export const BaseTabIcon = memo(function BaseTabIcon({
  accentColor,
  activeIndex,
  index,
  onLongPress,
  onPress,
  route,
  tabBarIcon,
}: BaseTabIconProps) {
  return (
    <Box
      height="full"
      justifyContent="flex-start"
      paddingTop={{ custom: TAB_BAR_INNER_PADDING }}
      testID={`tab-bar-icon-${route.name}`}
      width="full"
    >
      <ButtonPressAnimation
        disallowInterruption
        enableHapticFeedback
        scaleTo={0.75}
        onLongPress={() => onLongPress({ route, tabBarIcon })}
        onPress={() => onPress({ route, index, tabBarIcon })}
      >
        <Box alignItems="center" height={{ custom: TAB_BAR_PILL_HEIGHT }} justifyContent="center">
          {tabBarIcon === TAB_BAR_ICONS[Routes.PROFILE_SCREEN] ? (
            <ActivityTabIcon accentColor={accentColor} tabBarIcon={tabBarIcon} index={index} reanimatedPosition={activeIndex} />
          ) : (
            <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={activeIndex} />
          )}
        </Box>
      </ButtonPressAnimation>
    </Box>
  );
});

export const BrowserTabIconWrapper = memo(function BrowserTabIconWrapper({
  accentColor,
  activeIndex,
  index,
  onPress,
  route,
  showBrowserNavButtons,
  tabBarIcon,
}: BaseTabIconProps & { showBrowserNavButtons: SharedValue<boolean> }) {
  const [showBrowserButtons, setShowBrowserButtons] = useState(false);

  const canGoBackOrForward = useStoreSharedValue(useBrowserStore, state => {
    const navState = state.getActiveTabNavState();
    return navState.canGoBack || navState.canGoForward;
  });

  useAnimatedReaction(
    () => activeIndex.value === index && canGoBackOrForward.value,
    (current, previous) => {
      if (current !== previous) {
        showBrowserNavButtons.value = current;
        runOnJS(setShowBrowserButtons)(current);
      }
    },
    []
  );

  const browserPillWidthStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(showBrowserNavButtons.value ? TAB_BAR_PILL_HEIGHT * 2 : TAB_BAR_PILL_WIDTH, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  return (
    <Box
      as={Animated.View}
      height="full"
      key={route.key}
      justifyContent="flex-start"
      paddingTop={{ custom: TAB_BAR_INNER_PADDING }}
      style={browserPillWidthStyle}
      testID={`tab-bar-icon-${route.name}`}
    >
      <ConditionalWrap
        condition={Platform.OS === 'ios' || !showBrowserButtons}
        wrap={children => (
          <ButtonPressAnimation
            disallowInterruption
            enableHapticFeedback={!showBrowserButtons}
            onPress={() => onPress({ route, index, tabBarIcon })}
            scaleTo={showBrowserButtons ? 1 : 0.75}
            style={{ pointerEvents: showBrowserButtons ? 'box-none' : 'auto' }}
          >
            {children}
          </ButtonPressAnimation>
        )}
      >
        <Box alignItems="center" height={{ custom: TAB_BAR_PILL_HEIGHT }} justifyContent="center">
          <BrowserTabIcon
            accentColor={accentColor}
            index={index}
            reanimatedPosition={activeIndex}
            showNavButtons={showBrowserNavButtons}
            tabBarIcon={tabBarIcon}
          />
        </Box>
      </ConditionalWrap>
    </Box>
  );
});

function getTabBackgroundColor(route: RouteProp<ParamListBase, string>['name'], isDarkMode: boolean): string {
  'worklet';
  switch (route) {
    case Routes.DISCOVER_SCREEN:
    case Routes.DAPP_BROWSER_SCREEN:
    case Routes.RNBW_REWARDS_SCREEN:
      return isDarkMode ? BROWSER_BACKGROUND_COLOR_DARK : BROWSER_BACKGROUND_COLOR_LIGHT;
    default:
      return (isDarkMode ? darkModeThemeColors : lightModeThemeColors).white;
  }
}

const LazyPlaceholder = memo(function LazyPlaceholder({ route }: { route: RouteProp<ParamListBase, string>['name'] }) {
  const { isDarkMode } = useColorMode();
  const backgroundColor = getTabBackgroundColor(route, isDarkMode);

  return (
    <View
      style={{ backgroundColor, bottom: 0, height: DEVICE_HEIGHT, left: 0, position: 'absolute', right: 0, top: 0, width: DEVICE_WIDTH }}
    />
  );
});

const Swipe = createMaterialTopTabNavigator();

const TabBarContainer = ({ descriptors, jumpTo, navigation, state }: MaterialTopTabBarProps) => {
  const colorMode = useColorMode();
  const descriptorsRef = useRef(descriptors);
  const stateRef = useRef(state);

  const focusedIndexRef = useRef<number | undefined>(state.index);

  const currentIndex = state.index;
  const activeIndex = useDerivedValue(() => currentIndex, [currentIndex]);

  stateRef.current = state;
  descriptorsRef.current = descriptors;

  if (focusedIndexRef.current !== state.index) {
    focusedIndexRef.current = state.index;
  }

  const getIsFocused = useCallback(
    (index: number) => {
      return focusedIndexRef.current === index;
    },
    [focusedIndexRef]
  );

  const shouldForceDarkMode = useMemo(() => {
    return state.routes[state.index]?.name === Routes.RNBW_REWARDS_SCREEN;
  }, [state.index, state.routes]);

  return (
    <ColorModeProvider value={shouldForceDarkMode ? 'dark' : colorMode.colorMode}>
      <TabBar
        activeIndex={activeIndex}
        descriptorsRef={descriptorsRef}
        getIsFocused={getIsFocused}
        jumpTo={jumpTo}
        navigation={navigation}
        stateRef={stateRef}
      />
    </ColorModeProvider>
  );
};

function SwipeNavigatorScreens() {
  const enableLazyTabs = useExperimentalFlag(LAZY_TABS);
  const lazy = useNavigationStore(state => enableLazyTabs || !state.isWalletScreenMounted);

  const { dapp_browser, discover_enabled, rnbw_rewards_enabled, rnbw_membership_enabled } = useRemoteConfig(
    'dapp_browser',
    'discover_enabled',
    'rnbw_rewards_enabled',
    'rnbw_membership_enabled'
  );
  const showDiscoverTab = discover_enabled;
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showKingOfTheHillTab = useShowKingOfTheHill();
  const showRnbwRewardsTab = useExperimentalFlag(RNBW_REWARDS) || rnbw_rewards_enabled || IS_TEST;
  const showRnbwMembership = useExperimentalFlag(RNBW_MEMBERSHIP) || rnbw_membership_enabled || IS_TEST;
  const showRnbwRewardsOrMembershipTab = showRnbwRewardsTab || showRnbwMembership;

  const { language } = useAccountSettings();

  const getScreenOptions = useCallback(
    (props: { route: RouteProp<ParamListBase, string> }): MaterialTopTabNavigationOptions => {
      return {
        animationEnabled: false,
        // Make tabs always lazy for tests to reduce view hierarchy size.
        lazy: lazy || IS_TEST,
        lazyPlaceholder: () => <LazyPlaceholder route={props.route.name} />,
        swipeEnabled: false,
      };
    },
    [lazy]
  );

  const key = useMemo(() => {
    let key = 'swipe-navigator';
    if (showKingOfTheHillTab) {
      key += '-koth';
    }
    if (showDiscoverTab) {
      key += '-discover';
    }
    if (showRnbwRewardsTab) {
      key += '-rnbw-rewards';
    }
    if (showRnbwMembership) {
      key += '-rnbw-membership';
    }
    if (language) {
      key += `-${language}`;
    }
    return key;
  }, [showKingOfTheHillTab, showDiscoverTab, showRnbwRewardsTab, showRnbwMembership, language]);

  return (
    <Swipe.Navigator
      // required to force re-render when showKingOfTheHillTab, showRnbwRewardsTab or language changes
      key={key}
      initialLayout={deviceUtils.dimensions}
      initialRouteName={Routes.WALLET_SCREEN}
      screenOptions={getScreenOptions}
      tabBar={TabBarContainer}
      tabBarPosition="bottom"
    >
      <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.WALLET_SCREEN] }} />
      {showDiscoverTab && (
        <Swipe.Screen component={DiscoverScreen} name={Routes.DISCOVER_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.DISCOVER_SCREEN] }} />
      )}
      {showDappBrowserTab && (
        <Swipe.Screen component={DappBrowser} name={Routes.DAPP_BROWSER_SCREEN} options={{ title: 'tabDappBrowser' }} />
      )}
      {showKingOfTheHillTab ? (
        <Swipe.Screen
          component={KingOfTheHillScreen}
          name={Routes.KING_OF_THE_HILL}
          options={{ title: TAB_BAR_ICONS[Routes.KING_OF_THE_HILL] }}
        />
      ) : (
        <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.PROFILE_SCREEN] }} />
      )}
      {showRnbwRewardsOrMembershipTab &&
        (showRnbwMembership ? (
          <Swipe.Screen
            component={RnbwMembershipScreen}
            name={Routes.RNBW_MEMBERSHIP_SCREEN}
            options={{ title: TAB_BAR_ICONS[Routes.RNBW_MEMBERSHIP_SCREEN] }}
          />
        ) : (
          <Swipe.Screen
            component={RnbwRewardsScreen}
            name={Routes.RNBW_REWARDS_SCREEN}
            options={{ title: TAB_BAR_ICONS[Routes.RNBW_REWARDS_SCREEN] }}
          />
        ))}
    </Swipe.Navigator>
  );
}

export function SwipeNavigator() {
  return (
    <FlexItem backgroundColor={globalColors.white100}>
      <BrowserTabBarContextProvider>
        <MainListProvider>
          <RecyclerListViewScrollToTopProvider>
            <SwipeNavigatorScreens />
          </RecyclerListViewScrollToTopProvider>
        </MainListProvider>
      </BrowserTabBarContextProvider>

      <PendingTransactionWatcher />
      <AssetUpdateTransactionWatcher />
    </FlexItem>
  );
}

const styles = StyleSheet.create({
  tabBarBackgroundFade: {
    bottom: 0,
    height: TAB_BAR_HEIGHT,
    pointerEvents: 'none',
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
});
