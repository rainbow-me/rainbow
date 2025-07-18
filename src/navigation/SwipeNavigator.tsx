import ConditionalWrap from 'conditional-wrap';
import { BlurView } from 'react-native-blur-view';
import { LIGHT_SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { BrowserTabBarContextProvider, useBrowserTabBarContext } from '@/components/DappBrowser/BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import { FlexItem } from '@/components/layout';
import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import { TAB_BAR_PILL_HEIGHT, TAB_BAR_PILL_WIDTH } from '@/components/tab-bar/dimensions';
import { TestnetToast } from '@/components/toasts';
import { DAPP_BROWSER, KING_OF_THE_HILL_TAB, LAZY_TABS, POINTS, useExperimentalFlag } from '@/config';
import { Box, Columns, globalColors, Stack, useForegroundColor, useColorMode } from '@/design-system';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { useAccountAccentColor, useAccountSettings, useCoinListEdited, useDimensions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import RecyclerListViewScrollToTopProvider, {
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import { DappBrowser } from '@/components/DappBrowser/DappBrowser';
import { PointsScreen } from '@/screens/points/PointsScreen';
import WalletScreen from '@/screens/WalletScreen/WalletScreen';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import { MaterialTopTabBarProps, MaterialTopTabDescriptorMap } from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { NavigationHelpers, ParamListBase, RouteProp } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  BROWSER_BACKGROUND_COLOR_DARK,
  BROWSER_BACKGROUND_COLOR_LIGHT,
  HOMEPAGE_BACKGROUND_COLOR_DARK,
  HOMEPAGE_BACKGROUND_COLOR_LIGHT,
} from '@/components/DappBrowser/constants';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ProfileScreen from '../screens/ProfileScreen';
import DiscoverScreen from '@/screens/DiscoverScreen';
import { discoverScrollToTopFnRef, discoverOpenSearchFnRef } from '@/components/Discover/DiscoverScreenContext';
import { ScrollPositionContext } from './ScrollPositionContext';
import { MainListProvider, useMainList } from './MainListContext';
import Routes from './routesNames';
import { ActivityTabIcon } from '@/components/tab-bar/ActivityTabIcon';
import { BrowserTabIcon } from '@/components/tab-bar/BrowserTabIcon';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useNavigationStore } from '@/state/navigation/navigationStore';
import { KingOfTheHillScreen } from '@/screens/KingOfTheHill';

export const BASE_TAB_BAR_HEIGHT = 48;
export const TAB_BAR_HEIGHT = getTabBarHeight();

function getTabBarHeight() {
  return BASE_TAB_BAR_HEIGHT + (initialWindowMetrics?.insets.bottom ?? 0);
}

const HORIZONTAL_TAB_BAR_INSET = 6;
const HORIZONTAL_TAB_BAR_INSET_5_TABS = 10;

const Swipe = createMaterialTopTabNavigator();

interface TabBarProps {
  descriptors: MaterialTopTabDescriptorMap;
  jumpTo: (key: string) => void;
  navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
  state: { index: number; routes: RouteProp<ParamListBase, string>[] };
}

const TabBar = ({ descriptors, jumpTo, navigation, state }: TabBarProps) => {
  const { highContrastAccentColor: accentColor } = useAccountAccentColor();
  const { extraWebViewHeight, tabViewProgress } = useBrowserTabBarContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const recyclerList = useRecyclerListViewScrollToTopContext();
  const mainList = useMainList();

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const { dapp_browser, points_enabled } = useRemoteConfig('dapp_browser', 'points_enabled');
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  const showBrowserNavButtons = useBrowserStore(state => {
    if (!showDappBrowserTab) return false;
    const activeTabNavState = state.getActiveTabNavState();
    return activeTabNavState.canGoBack || activeTabNavState.canGoForward;
  });

  const numberOfTabs = 3 + (showPointsTab ? 1 : 0) + (showDappBrowserTab ? 1 : 0);
  const horizontalInset = numberOfTabs > 4 ? HORIZONTAL_TAB_BAR_INSET_5_TABS : HORIZONTAL_TAB_BAR_INSET;
  const tabWidth = (deviceWidth - horizontalInset * 2) / numberOfTabs;
  const tabPillStartPosition = (tabWidth - TAB_BAR_PILL_WIDTH) / 2 + horizontalInset;

  const reanimatedPosition = useSharedValue(0);

  const tabPositions = useDerivedValue(() => {
    const inputRange = Array.from({ length: numberOfTabs }, (_, index) => index);
    const outputRange = Array.from({ length: numberOfTabs }, (_, index) => tabPillStartPosition + tabWidth * index);
    return { inputRange, outputRange };
  });

  const backgroundPillStyle = useAnimatedStyle(() => {
    const isDappBrowserTab = showDappBrowserTab && reanimatedPosition.value === 2 && showBrowserNavButtons;
    const backgroundOpacity = isDappBrowserTab ? 0 : 1;
    const translateX = interpolate(reanimatedPosition.value, tabPositions.value.inputRange, tabPositions.value.outputRange, 'clamp');

    return {
      backgroundColor: opacityWorklet(accentColor, (isDarkMode ? 0.25 : 0.1) * backgroundOpacity),
      transform: [{ translateX }],
    };
  });

  const dappBrowserTabBarStyle = useAnimatedStyle(() => {
    const shouldUseBrowserStyle = showDappBrowserTab && reanimatedPosition.value === 2;
    return {
      borderTopColor: isDarkMode ? separatorSecondary : LIGHT_SEPARATOR_COLOR,
      borderTopWidth: withTiming(shouldUseBrowserStyle ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
      opacity: withTiming(shouldUseBrowserStyle ? 1 : 0, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  const dappBrowserTabBarShadowStyle = useAnimatedStyle(() => {
    const defaultShadowOpacity = isDarkMode ? 0.2 : 0.04;
    const shadowOpacity = showDappBrowserTab && reanimatedPosition.value === 2 ? 0 : defaultShadowOpacity;
    return {
      shadowOpacity: withTiming(shadowOpacity, TIMING_CONFIGS.slowFadeConfig),
    };
  });

  const hideForBrowserTabViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress.value || 0;
    const opacity = 1 - progress / 75;
    const pointerEvents = extraWebViewHeight.value > 0 || opacity < 1 ? 'none' : 'auto';

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
    };
  });

  // For when QRScannerScreen is re-added
  // const offScreenTabBar = useAnimatedStyle(() => {
  //   const translateX = interpolate(
  //     reanimatedPosition.value,
  //     [0, 1, 2],
  //     [deviceWidth, 0, 0]
  //   );
  //   return {
  //     transform: [
  //       {
  //         translateX,
  //       },
  //     ],
  //   };
  // });

  const canSwitchRef = useRef(true);
  const canSwitchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPressRef = useRef<number | undefined>(undefined);

  useAnimatedReaction(
    () => state.index,
    (current, previous) => {
      if (current !== previous) {
        reanimatedPosition.value = current;
      }
    }
  );

  const onPress = useCallback(
    (route: { key: string }, index: number, isFocused: boolean, tabBarIcon: string) => {
      if (!canSwitchRef.current) return;

      const time = new Date().getTime();
      const delta = time - (lastPressRef.current || 0);

      const DOUBLE_PRESS_DELAY = 400;

      if (!isFocused) {
        canSwitchRef.current = false;
        jumpTo(route.key);
        reanimatedPosition.value = index;
        if (canSwitchTimeoutRef.current) clearTimeout(canSwitchTimeoutRef.current);
        canSwitchTimeoutRef.current = setTimeout(() => {
          canSwitchRef.current = true;
        }, 5);
      } else if (isFocused && tabBarIcon === 'tabDiscover') {
        if (delta < DOUBLE_PRESS_DELAY) {
          discoverOpenSearchFnRef?.();
          return;
        }

        if (discoverScrollToTopFnRef?.() === 0) {
          discoverOpenSearchFnRef?.();
          return;
        }
      } else if (isFocused && tabBarIcon === 'tabHome') {
        recyclerList.scrollToTop?.();
      } else if (isFocused && tabBarIcon === 'tabActivity') {
        mainList?.scrollToTop();
      }

      lastPressRef.current = time;
    },
    [canSwitchRef, jumpTo, reanimatedPosition, recyclerList, mainList]
  );

  const onLongPress = useCallback(
    (route: { key: string }, tabBarIcon: string) => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });

      if (tabBarIcon === 'tabHome') {
        navigation.navigate(Routes.CHANGE_WALLET_SHEET);
      }
      if (tabBarIcon === 'tabDiscover') {
        navigation.navigate(Routes.DISCOVER_SCREEN);
        InteractionManager.runAfterInteractions(() => {
          discoverOpenSearchFnRef?.();
        });
      }
    },
    [navigation]
  );

  const renderedTabs = useMemo(
    () =>
      state.routes.map((route: { key: string; name: string }, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        // This is a hack to avoid the built-in title type of string | undefined
        // options.title should never be undefined as long as a title is specified for each Swipe.Screen
        const tabBarIcon = options.title as string;

        const showBrowserButtons = showBrowserNavButtons && route.name === Routes.DAPP_BROWSER_SCREEN && isFocused;

        return (
          <Box height="full" key={route.key} justifyContent="flex-start" paddingTop="6px" width="full">
            <ConditionalWrap
              condition={IS_IOS || !showBrowserButtons}
              wrap={children => (
                <ButtonPressAnimation
                  testID={`tab-bar-icon-${route.name}`}
                  disallowInterruption
                  enableHapticFeedback={!showBrowserButtons}
                  minLongPressDuration={300}
                  onLongPress={() => onLongPress(route, tabBarIcon)}
                  onPress={() => onPress(route, index, isFocused, tabBarIcon)}
                  scaleTo={showBrowserButtons ? 1 : 0.75}
                  style={{ pointerEvents: showBrowserButtons ? 'box-none' : 'auto' }}
                >
                  {children}
                </ButtonPressAnimation>
              )}
            >
              <Stack alignHorizontal="center">
                <Box alignItems="center" height={{ custom: TAB_BAR_PILL_HEIGHT }} justifyContent="center">
                  {tabBarIcon === 'tabActivity' ? (
                    <ActivityTabIcon
                      accentColor={accentColor}
                      tabBarIcon={tabBarIcon}
                      index={index}
                      reanimatedPosition={reanimatedPosition}
                    />
                  ) : tabBarIcon === 'tabDappBrowser' ? (
                    <BrowserTabIcon
                      accentColor={accentColor}
                      tabBarIcon={tabBarIcon}
                      index={index}
                      reanimatedPosition={reanimatedPosition}
                    />
                  ) : (
                    <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
                  )}
                </Box>
              </Stack>
            </ConditionalWrap>
          </Box>
        );
      }),
    [accentColor, descriptors, onLongPress, onPress, reanimatedPosition, showBrowserNavButtons, state.index, state.routes]
  );

  const shadowStyles = useMemo(() => {
    if (IS_ANDROID) {
      return { outer: {}, inner: {} };
    }
    return {
      outer: {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: isDarkMode ? 0.2 : 0.04,
        shadowRadius: 20,
      },
      inner: {
        shadowColor: globalColors.grey100,
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: isDarkMode ? 0.2 : 0.04,
        shadowRadius: 3,
      },
    };
  }, [isDarkMode]);

  return (
    <Box bottom={{ custom: 0 }} height={{ custom: TAB_BAR_HEIGHT }} pointerEvents="box-none" position="absolute" width="full">
      <Box as={Animated.View} style={[shadowStyles.outer, IS_IOS ? dappBrowserTabBarShadowStyle : {}, hideForBrowserTabViewStyle]}>
        <Box as={Animated.View} style={[shadowStyles.inner, IS_IOS ? dappBrowserTabBarShadowStyle : {}]}>
          <Box height={{ custom: TAB_BAR_HEIGHT }} width="full">
            {IS_IOS && <BlurView blurStyle={isDarkMode ? 'chromeMaterialDark' : 'chromeMaterialLight'} style={StyleSheet.absoluteFill} />}
            <Box
              height="full"
              position="absolute"
              style={{
                backgroundColor: isDarkMode ? colors.alpha('#191A1C', IS_IOS ? 0.7 : 1) : colors.alpha(colors.white, IS_IOS ? 0.7 : 1),
              }}
              width="full"
            />
            <Box
              as={Animated.View}
              height="full"
              position="absolute"
              style={[
                dappBrowserTabBarStyle,
                { backgroundColor: isDarkMode ? HOMEPAGE_BACKGROUND_COLOR_DARK : HOMEPAGE_BACKGROUND_COLOR_LIGHT },
              ]}
              width="full"
            />
            <Box
              alignItems="center"
              as={Animated.View}
              borderRadius={TAB_BAR_PILL_HEIGHT / 2}
              height={{ custom: TAB_BAR_PILL_HEIGHT }}
              justifyContent="center"
              position="absolute"
              style={backgroundPillStyle}
              top={{ custom: 6 }}
              width={{ custom: TAB_BAR_PILL_WIDTH }}
            />
            <Box paddingHorizontal={{ custom: horizontalInset }}>
              <Columns alignVertical="center">{renderedTabs}</Columns>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

function LazyPlaceholder({ route }: { route: RouteProp<ParamListBase, string>['name'] }) {
  const { isDarkMode } = useColorMode();
  const { colors } = useTheme();

  const backgroundColor =
    route === Routes.DAPP_BROWSER_SCREEN || route === Routes.POINTS_SCREEN
      ? isDarkMode
        ? BROWSER_BACKGROUND_COLOR_DARK
        : BROWSER_BACKGROUND_COLOR_LIGHT
      : colors.white;

  return (
    <View
      style={{ backgroundColor, bottom: 0, height: DEVICE_HEIGHT, left: 0, position: 'absolute', right: 0, top: 0, width: DEVICE_WIDTH }}
    />
  );
}

function getTabBar({ descriptors, jumpTo, navigation, state }: MaterialTopTabBarProps) {
  return <TabBar descriptors={descriptors} jumpTo={jumpTo} navigation={navigation} state={state} />;
}

function SwipeNavigatorScreens() {
  const { isCoinListEdited } = useCoinListEdited();
  const enableLazyTabs = useExperimentalFlag(LAZY_TABS);
  const lazy = useNavigationStore(state => enableLazyTabs || !state.isWalletScreenMounted);

  const { dapp_browser, points_enabled, king_of_the_hill_tab_enabled } = useRemoteConfig(
    'dapp_browser',
    'points_enabled',
    'king_of_the_hill_tab_enabled'
  );
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;
  const showKingOfTheHillTab = (useExperimentalFlag(KING_OF_THE_HILL_TAB) || king_of_the_hill_tab_enabled) && !IS_TEST;

  const getScreenOptions = useCallback(
    (props: { route: RouteProp<ParamListBase, string> }) => {
      const isOnBrowserTab = props.route.name === Routes.DAPP_BROWSER_SCREEN;
      return {
        animationEnabled: false,
        // Make tabs always lazy for tests to reduce view hierarchy size.
        lazy: lazy || IS_TEST,
        lazyPlaceholder: () => <LazyPlaceholder route={props.route.name} />,
        swipeEnabled: (!isOnBrowserTab && !isCoinListEdited) || IS_TEST,
      };
    },
    [isCoinListEdited, lazy]
  );

  return (
    <Swipe.Navigator
      initialLayout={deviceUtils.dimensions}
      initialRouteName={Routes.WALLET_SCREEN}
      screenOptions={getScreenOptions}
      tabBar={getTabBar}
      tabBarPosition="bottom"
    >
      {/* For when QRScannerScreen is re-added */}
      {/* <Swipe.Screen
        component={QRScannerScreen}
        name={Routes.QR_SCANNER_SCREEN}
        options={{
          title: 'none',
        }}
      /> */}
      <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} options={{ title: 'tabHome' }} />
      <Swipe.Screen component={DiscoverScreen} name={Routes.DISCOVER_SCREEN} options={{ title: 'tabDiscover' }} />
      {showDappBrowserTab && (
        <Swipe.Screen component={DappBrowser} name={Routes.DAPP_BROWSER_SCREEN} options={{ title: 'tabDappBrowser' }} />
      )}
      {showKingOfTheHillTab ? (
        <Swipe.Screen component={KingOfTheHillScreen} name={Routes.KING_OF_THE_HILL} options={{ title: 'tabKingOfTheHill' }} />
      ) : (
        <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} options={{ title: 'tabActivity' }} />
      )}
      {showPointsTab && <Swipe.Screen component={PointsScreen} name={Routes.POINTS_SCREEN} options={{ title: 'tabPoints' }} />}
    </Swipe.Navigator>
  );
}

export function SwipeNavigator() {
  const { chainId } = useAccountSettings();
  const { colors } = useTheme();

  return (
    <FlexItem backgroundColor={colors.white}>
      <BrowserTabBarContextProvider>
        <MainListProvider>
          <RecyclerListViewScrollToTopProvider>
            {/* @ts-expect-error JS component */}
            <ScrollPositionContext.Provider>
              <SwipeNavigatorScreens />
            </ScrollPositionContext.Provider>
          </RecyclerListViewScrollToTopProvider>
        </MainListProvider>
      </BrowserTabBarContextProvider>

      <TestnetToast chainId={chainId} />
    </FlexItem>
  );
}

// For when QRScannerScreen is re-added
// const ShadowWrapper = ({ children }: { children: React.ReactNode }) => {
//   const { isDarkMode } = useTheme();

//   return IS_ANDROID ? (
//     children
//   ) : (
//     <Box
//       as={Animated.View}
//       style={[
//         offScreenTabBar,
//         {
//           shadowColor: globalColors.grey100,
//           shadowOffset: { width: 0, height: -4 },
//           shadowOpacity: isDarkMode ? 0.2 : 0.04,
//           shadowRadius: 20,
//         },
//       ]}
//     >
//       <Box
//         style={{
//           shadowColor: globalColors.grey100,
//           shadowOffset: { width: 0, height: -1 },
//           shadowOpacity: isDarkMode ? 0.2 : 0.04,
//           shadowRadius: 3,
//         }}
//       >
//         {children}
//       </Box>
//     </Box>
//   );
// };
