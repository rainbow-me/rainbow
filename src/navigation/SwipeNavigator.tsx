import ConditionalWrap from 'conditional-wrap';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BrowserTabBarContextProvider, useBrowserTabBarContext } from '@/components/DappBrowser/BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import { FlexItem } from '@/components/layout';
import { TabBarIcon } from '@/components/tab-bar/TabBarIcon';
import {
  TAB_BAR_PILL_HEIGHT,
  TAB_BAR_HORIZONTAL_INSET,
  TAB_BAR_PILL_WIDTH,
  TAB_BAR_INNER_PADDING,
  TAB_BAR_WIDTH,
} from '@/components/tab-bar/dimensions';
import { TestnetToast } from '@/components/toasts';
import { DAPP_BROWSER, LAZY_TABS, POINTS, useExperimentalFlag } from '@/config';
import { Box, Columns, globalColors, useColorMode, Column } from '@/design-system';
import { IS_IOS, IS_TEST } from '@/env';
import { useAccountAccentColor, useAccountSettings, useCoinListEdited, useDimensions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import {
  RecyclerListViewScrollToTopProvider,
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import { DappBrowser } from '@/components/DappBrowser/DappBrowser';
import { PointsScreen } from '@/screens/points/PointsScreen';
import WalletScreen from '@/screens/WalletScreen/WalletScreen';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import {
  MaterialTopTabBarProps,
  MaterialTopTabDescriptorMap,
  MaterialTopTabNavigationOptions,
} from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { NavigationHelpers, ParamListBase, RouteProp } from '@react-navigation/native';
import React, { MutableRefObject, memo, useCallback, useMemo, useRef, useState } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import Animated, {
  DerivedValue,
  Easing,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BROWSER_BACKGROUND_COLOR_DARK, BROWSER_BACKGROUND_COLOR_LIGHT } from '@/components/DappBrowser/constants';
import { SPRING_CONFIGS, TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { useBrowserStore } from '@/state/browser/browserStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ProfileScreen from '../screens/ProfileScreen';
import DiscoverScreen from '@/screens/DiscoverScreen';
import { discoverScrollToTopFnRef, discoverOpenSearchFnRef } from '@/components/Discover/DiscoverScreenContext';
import { MainListProvider, useMainList } from './MainListContext';
import Routes, { Route } from './routesNames';
import { ActivityTabIcon } from '@/components/tab-bar/ActivityTabIcon';
import { BrowserTabIcon } from '@/components/tab-bar/BrowserTabIcon';
import { initialWindowMetrics } from 'react-native-safe-area-context';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { PendingTransactionWatcher } from '@/components/pending-transaction-watcher/PendingTransactionWatcher';
import { MinedTransactionWatcher } from '@/components/mined-transaction-watcher/MinedTransactionWatcher';
import { KingOfTheHillScreen } from '@/screens/KingOfTheHill';
import { setActiveRoute, useNavigationStore } from '@/state/navigation/navigationStore';
import { darkModeThemeColors, lightModeThemeColors } from '@/styles/colors';
import { BlurGradient } from '@/components/blur/BlurGradient';
import LinearGradient from 'react-native-linear-gradient';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { PANEL_COLOR_DARK } from '@/components/SmoothPager/ListPanel';
import { useStoreSharedValue } from '@/state/internal/hooks/useStoreSharedValue';
import { useShowKingOfTheHill } from '@/components/king-of-the-hill/useShowKingOfTheHill';

export const BASE_TAB_BAR_HEIGHT = 52;
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
  [Routes.POINTS_SCREEN]: 'tabPoints',
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

  const { dapp_browser, points_enabled } = useRemoteConfig('dapp_browser', 'points_enabled');
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  const numberOfTabs = 3 + (showPointsTab ? 1 : 0) + (showDappBrowserTab ? 1 : 0);
  const tabWidth = (deviceWidth - TAB_BAR_HORIZONTAL_INSET * 2 - TAB_BAR_INNER_PADDING * 2) / numberOfTabs;
  const tabPillStartPosition = (tabWidth - TAB_BAR_PILL_WIDTH) / 2 + TAB_BAR_INNER_PADDING;

  const reanimatedPosition = useSharedValue(0);
  const showBrowserNavButtons = useSharedValue(false);

  const tabPositions = useDerivedValue(() => {
    const inputRange = Array.from({ length: numberOfTabs }, (_, index) => index);
    const outputRange = Array.from({ length: numberOfTabs }, (_, index) => tabPillStartPosition + tabWidth * index);
    return { inputRange, outputRange };
  });

  const backgroundPillStyle = useAnimatedStyle(() => {
    const isDappBrowserTab = showDappBrowserTab && reanimatedPosition.value === 2 && showBrowserNavButtons.value;
    const backgroundOpacity = isDappBrowserTab ? 0 : 1;
    const translateX = interpolate(reanimatedPosition.value, tabPositions.value.inputRange, tabPositions.value.outputRange, 'clamp');

    return {
      backgroundColor: opacityWorklet(accentColor, (isDarkMode ? 0.2 : 0.1) * backgroundOpacity),
      transform: [{ translateX: withSpring(translateX, SPRING_CONFIGS.snappyMediumSpringConfig) }],
    };
  });

  const dappBrowserTabBarStyle = useAnimatedStyle(() => {
    const shouldUseBrowserStyle = showDappBrowserTab && reanimatedPosition.value === 2;
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
        if ((!showDappBrowserTab && route.name === Routes.DAPP_BROWSER_SCREEN) || (!showPointsTab && route.name === Routes.POINTS_SCREEN)) {
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
      showPointsTab,
      stateRef,
    ]
  );

  const shadowStyle = useAnimatedStyle(() => {
    const isDappBrowserTab = showDappBrowserTab && reanimatedPosition.value === 2;
    return {
      shadowOpacity: withSpring(isDarkMode ? 0.6 : isDappBrowserTab ? 0 : 0.16, SPRING_CONFIGS.snappyMediumSpringConfig),
    };
  });

  const gradientBackgroundStyle = useAnimatedStyle(() => {
    const route = getRouteFromTabIndex(reanimatedPosition.value);
    return {
      backgroundColor: route === Routes.DAPP_BROWSER_SCREEN ? 'transparent' : getTabBackgroundColor(route, isDarkMode),
    };
  });

  return (
    <>
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

      <Animated.View style={[{ shadowColor: globalColors.grey100, shadowOffset: { width: 0, height: 12 }, shadowRadius: 18 }, shadowStyle]}>
        <Box
          as={Animated.View}
          borderColor={isDarkMode ? 'separatorSecondary' : { custom: 'rgba(255, 255, 255, 0.64)' }}
          borderWidth={THICK_BORDER_WIDTH}
          borderRadius={TAB_BAR_BORDER_RADIUS}
          bottom={{ custom: TAB_BAR_HEIGHT - BASE_TAB_BAR_HEIGHT }}
          height={{ custom: BASE_TAB_BAR_HEIGHT }}
          pointerEvents="box-none"
          position="absolute"
          style={[hideForBrowserTabViewStyle, { alignSelf: 'center' }]}
        >
          <Box height={{ custom: BASE_TAB_BAR_HEIGHT }} width="full">
            {IS_IOS ? (
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
    () => activeIndex.value === 2 && canGoBackOrForward.value,
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
        condition={IS_IOS || !showBrowserButtons}
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

function getRouteFromTabIndex(index: number): RouteProp<ParamListBase, string>['name'] {
  'worklet';
  switch (index) {
    case 0:
      return Routes.WALLET_SCREEN;
    case 1:
      return Routes.DISCOVER_SCREEN;
    case 2:
      return Routes.DAPP_BROWSER_SCREEN;
    case 3:
      return Routes.PROFILE_SCREEN;
    case 4:
      return Routes.POINTS_SCREEN;
    default:
      return Routes.WALLET_SCREEN;
  }
}

function getTabBackgroundColor(route: RouteProp<ParamListBase, string>['name'], isDarkMode: boolean): string {
  'worklet';
  switch (route) {
    case Routes.DISCOVER_SCREEN:
    case Routes.DAPP_BROWSER_SCREEN:
    case Routes.POINTS_SCREEN:
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

  return (
    <TabBar
      activeIndex={activeIndex}
      descriptorsRef={descriptorsRef}
      getIsFocused={getIsFocused}
      jumpTo={jumpTo}
      navigation={navigation}
      stateRef={stateRef}
    />
  );
};

function SwipeNavigatorScreens() {
  const { isCoinListEdited } = useCoinListEdited();
  const enableLazyTabs = useExperimentalFlag(LAZY_TABS);
  const lazy = useNavigationStore(state => enableLazyTabs || !state.isWalletScreenMounted);

  const { dapp_browser, points_enabled } = useRemoteConfig('dapp_browser', 'points_enabled');
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;
  const showKingOfTheHillTab = useShowKingOfTheHill();

  const getScreenOptions = useCallback(
    (props: { route: RouteProp<ParamListBase, string> }): MaterialTopTabNavigationOptions => {
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
      // required to force re-render when showKingOfTheHillTab changes
      key={`swipe-navigator-${showKingOfTheHillTab ? 'koth' : 'profile'}`}
      initialLayout={deviceUtils.dimensions}
      initialRouteName={Routes.WALLET_SCREEN}
      screenOptions={getScreenOptions}
      tabBar={TabBarContainer}
      tabBarPosition="bottom"
    >
      <Swipe.Screen component={WalletScreen} name={Routes.WALLET_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.WALLET_SCREEN] }} />
      <Swipe.Screen component={DiscoverScreen} name={Routes.DISCOVER_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.DISCOVER_SCREEN] }} />
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
      {showPointsTab && (
        <Swipe.Screen component={PointsScreen} name={Routes.POINTS_SCREEN} options={{ title: TAB_BAR_ICONS[Routes.POINTS_SCREEN] }} />
      )}
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
            <SwipeNavigatorScreens />
          </RecyclerListViewScrollToTopProvider>
        </MainListProvider>
      </BrowserTabBarContextProvider>

      <TestnetToast chainId={chainId} />
      <PendingTransactionWatcher />
      <MinedTransactionWatcher />
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
