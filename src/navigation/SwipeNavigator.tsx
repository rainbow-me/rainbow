import ConditionalWrap from 'conditional-wrap';
import { LIGHT_SEPARATOR_COLOR, THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import { BrowserTabBarContextProvider, useBrowserTabBarContext } from '@/components/DappBrowser/BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import { TAB_BAR_ICON_SIZE, TabBarIcon } from '@/components/icons/TabBarIcon';
import { FlexItem } from '@/components/layout';
import { TestnetToast } from '@/components/toasts';
import { DAPP_BROWSER, POINTS, useExperimentalFlag } from '@/config';
import { Box, Columns, globalColors, Stack, useForegroundColor, Text, Cover, useColorMode, TextIcon } from '@/design-system';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { useAccountAccentColor, useAccountSettings, useCoinListEdited, useDimensions, usePendingTransactions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import RecyclerListViewScrollToTopProvider, {
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import DappBrowserScreen from '@/screens/dapp-browser/DappBrowserScreen';
import { discoverOpenSearchFnRef } from '@/screens/discover/components/DiscoverSearchContainer';
import { PointsScreen } from '@/screens/points/PointsScreen';
import WalletScreen from '@/screens/WalletScreen';
import { useTheme } from '@/theme';
import { deviceUtils, safeAreaInsetValues } from '@/utils';
import { BlurView } from '@react-native-community/blur';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import { MaterialTopTabDescriptorMap } from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { NavigationHelpers, ParamListBase, RouteProp } from '@react-navigation/native';
import React, { memo, useCallback, useMemo, useRef } from 'react';
import { InteractionManager, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT } from '@/components/DappBrowser/constants';
import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import { TIMING_CONFIGS } from '@/components/animations/animationConfigs';
import { TextSize } from '@/design-system/components/Text/Text';
import { useBrowserStore } from '@/state/browser/browserStore';
import { opacityWorklet } from '@/__swaps__/utils/swaps';
import ProfileScreen from '../screens/ProfileScreen';
import DiscoverScreen, { discoverScrollToTopFnRef } from '../screens/discover/DiscoverScreen';
import { ScrollPositionContext } from './ScrollPositionContext';
import SectionListScrollToTopProvider, { useSectionListScrollToTopContext } from './SectionListScrollToTopContext';
import Routes from './routesNames';

export const TAB_BAR_HEIGHT = IS_IOS ? 48 + safeAreaInsetValues.bottom : 54;

const FADE_CONFIG = TIMING_CONFIGS.slowFadeConfig;

const HORIZONTAL_TAB_BAR_INSET = 6;
const HORIZONTAL_TAB_BAR_INSET_5_TABS = 10;
const TAB_BAR_PILL_HEIGHT = 36;
const TAB_BAR_PILL_WIDTH = 72;

const Swipe = createMaterialTopTabNavigator();

const ActivityTabIcon = memo(function ActivityTabIcon({
  accentColor,
  index,
  reanimatedPosition,
  tabBarIcon,
}: {
  accentColor: string;
  index: number;
  reanimatedPosition: SharedValue<number>;
  tabBarIcon: string;
}) {
  const { pendingTransactions } = usePendingTransactions();

  const pendingCount = pendingTransactions.length;

  const textSize: TextSize = useMemo(() => {
    if (pendingCount < 10) {
      return '15pt';
    } else if (pendingCount < 20) {
      return '12pt';
    } else {
      return '11pt';
    }
  }, [pendingCount]);

  return pendingCount > 0 ? (
    <Box
      testID="transactions-pending-tab-icon"
      width={{ custom: TAB_BAR_ICON_SIZE }}
      height={{ custom: TAB_BAR_ICON_SIZE }}
      alignItems="center"
      justifyContent="center"
    >
      <AnimatedSpinner color={accentColor} isLoading requireSrc={require('@/assets/tabSpinner.png')} size={TAB_BAR_ICON_SIZE} />
      <Cover>
        <Box width="full" height="full" alignItems="center" justifyContent="center">
          <Text color={{ custom: accentColor }} size={textSize} weight="heavy" align="center">
            {pendingCount}
          </Text>
        </Box>
      </Cover>
    </Box>
  ) : (
    <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
  );
});

const BrowserTabIcon = memo(function BrowserTabIcon({
  accentColor,
  index,
  reanimatedPosition,
  tabBarIcon,
}: {
  accentColor: string;
  index: number;
  reanimatedPosition: SharedValue<number>;
  tabBarIcon: string;
}) {
  const { isDarkMode } = useColorMode();
  const { goBack, goForward } = useBrowserTabBarContext();

  const navState = useBrowserStore(state => state.getActiveTabNavState());

  const showNavButtons = useDerivedValue(() => reanimatedPosition.value === 2 && (navState.canGoBack || navState.canGoForward));

  const navButtonsBackgroundOpacity = useDerivedValue(() => {
    const navButtonsVisible = reanimatedPosition.value === 2 && (navState.canGoBack || navState.canGoForward);
    return withTiming(navButtonsVisible ? 1 : 0, FADE_CONFIG);
  });

  const navButtonsStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: opacityWorklet(accentColor, 0.06 * navButtonsBackgroundOpacity.value),
      opacity: withTiming(showNavButtons.value ? 1 : 0, FADE_CONFIG),
      pointerEvents: showNavButtons.value ? 'auto' : 'none',
    };
  });

  const animatedBorderStyle = useAnimatedStyle(() => {
    return {
      borderColor: opacityWorklet(accentColor, (isDarkMode ? 0.08 : 0.04) * navButtonsBackgroundOpacity.value),
    };
  });

  const backButtonStyle = useAnimatedStyle(() => {
    const disabledOpacity = isDarkMode ? 0.2 : 0.28;
    return {
      opacity: withTiming(navState.canGoBack ? 1 : disabledOpacity, FADE_CONFIG),
      transform: [
        { translateX: withTiming(showNavButtons.value ? 0 : 16, FADE_CONFIG) },
        { scale: withTiming(showNavButtons.value ? 1 : 0.75, FADE_CONFIG) },
      ],
    };
  });

  const forwardButtonStyle = useAnimatedStyle(() => {
    const disabledOpacity = isDarkMode ? 0.2 : 0.28;
    return {
      opacity: withTiming(navState.canGoForward ? 1 : disabledOpacity, FADE_CONFIG),
      transform: [
        { translateX: withTiming(showNavButtons.value ? 0 : -16, FADE_CONFIG) },
        { scale: withTiming(showNavButtons.value ? 1 : 0.75, FADE_CONFIG) },
      ],
    };
  });

  const tabIconStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(showNavButtons.value ? 0 : 1, FADE_CONFIG),
      pointerEvents: showNavButtons.value ? 'none' : 'auto',
      transform: [{ scale: withTiming(showNavButtons.value ? 0.75 : 1, FADE_CONFIG) }],
    };
  });

  return (
    <Box
      testID="dapp-browser-tab-icon"
      width={{ custom: TAB_BAR_PILL_WIDTH }}
      height={{ custom: TAB_BAR_PILL_HEIGHT }}
      alignItems="center"
      justifyContent="center"
    >
      <Animated.View style={[navButtonsStyle, styles.navButtonsPill]}>
        <ButtonPressAnimation
          onPress={() => goBack()}
          scaleTo={0.75}
          style={[styles.navButton, styles.backButton, { pointerEvents: navState.canGoBack ? 'auto' : 'none' }]}
        >
          <Animated.View style={backButtonStyle}>
            <TextIcon color={{ custom: accentColor }} containerSize={32} size="icon 18px" weight="bold">
              􀆉
            </TextIcon>
          </Animated.View>
        </ButtonPressAnimation>
        <ButtonPressAnimation
          onPress={() => goForward()}
          scaleTo={0.75}
          style={[styles.navButton, styles.forwardButton, { pointerEvents: navState.canGoForward ? 'auto' : 'none' }]}
        >
          <Animated.View style={forwardButtonStyle}>
            <TextIcon color={{ custom: accentColor }} containerSize={32} size="icon 18px" weight="bold">
              􀆊
            </TextIcon>
          </Animated.View>
        </ButtonPressAnimation>
        <Animated.View style={[animatedBorderStyle, styles.cover, styles.navButtonsBorder]} />
      </Animated.View>
      <Animated.View style={[tabIconStyle, styles.cover]}>
        <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
      </Animated.View>
    </Box>
  );
});

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
  const sectionList = useSectionListScrollToTopContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const { dapp_browser, points_enabled } = useRemoteConfig();
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
      borderTopWidth: withTiming(shouldUseBrowserStyle ? 1 : 0, FADE_CONFIG),
      opacity: withTiming(shouldUseBrowserStyle ? 1 : 0, FADE_CONFIG),
    };
  });

  const dappBrowserTabBarShadowStyle = useAnimatedStyle(() => {
    const defaultShadowOpacity = isDarkMode ? 0.2 : 0.04;
    const shadowOpacity = showDappBrowserTab && reanimatedPosition.value === 2 ? 0 : defaultShadowOpacity;
    return {
      shadowOpacity: withTiming(shadowOpacity, FADE_CONFIG),
    };
  });

  const hideForBrowserTabViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress.value || 0;
    const opacity = 1 - progress / 75;
    const pointerEvents = opacity < 1 ? 'none' : 'auto';

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
          // @ts-expect-error No call signatures
          discoverOpenSearchFnRef?.();
          return;
        }

        if (discoverScrollToTopFnRef?.() === 0) {
          // @ts-expect-error No call signatures
          discoverOpenSearchFnRef?.();
          return;
        }
      } else if (isFocused && tabBarIcon === 'tabHome') {
        recyclerList.scrollToTop?.();
      } else if (isFocused && tabBarIcon === 'tabActivity') {
        sectionList.scrollToTop?.();
      }

      lastPressRef.current = time;
    },
    [canSwitchRef, jumpTo, reanimatedPosition, recyclerList, sectionList]
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
          // @ts-expect-error No call signatures
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
          <Box
            height="full"
            key={route.key}
            justifyContent="flex-start"
            paddingTop="6px"
            testID={`tab-bar-icon-${route.name}`}
            width="full"
          >
            <ConditionalWrap
              condition={IS_IOS || !showBrowserButtons}
              wrap={children => (
                <ButtonPressAnimation
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
                  {/* eslint-disable-next-line no-nested-ternary */}
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
          {/* @ts-expect-error The conditional as={} is causing type errors */}
          <Box
            as={IS_IOS ? BlurView : View}
            height={{ custom: TAB_BAR_HEIGHT }}
            width="full"
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...(IS_IOS && {
              blurAmount: 40,
              blurType: isDarkMode ? 'chromeMaterialDark' : 'chromeMaterialLight',
            })}
          >
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

function SwipeNavigatorScreens() {
  const { isCoinListEdited } = useCoinListEdited();

  const { dapp_browser, points_enabled } = useRemoteConfig();
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  return (
    <Swipe.Navigator
      initialLayout={deviceUtils.dimensions}
      initialRouteName={Routes.WALLET_SCREEN}
      screenOptions={props => {
        const isOnBrowserTab = props.route.name === Routes.DAPP_BROWSER_SCREEN;
        return {
          animationEnabled: false,
          swipeEnabled: (!isOnBrowserTab && !isCoinListEdited) || IS_TEST,
        };
      }}
      tabBar={({ descriptors, jumpTo, navigation, state: { index, routes } }) => (
        <TabBar descriptors={descriptors} jumpTo={jumpTo} navigation={navigation} state={{ index, routes }} />
      )}
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
        <Swipe.Screen component={DappBrowserScreen} name={Routes.DAPP_BROWSER_SCREEN} options={{ title: 'tabDappBrowser' }} />
      )}
      <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} options={{ title: 'tabActivity' }} />
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
        <SectionListScrollToTopProvider>
          <RecyclerListViewScrollToTopProvider>
            {/* @ts-expect-error JS component */}
            <ScrollPositionContext.Provider>
              <SwipeNavigatorScreens />
            </ScrollPositionContext.Provider>
          </RecyclerListViewScrollToTopProvider>
        </SectionListScrollToTopProvider>
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

const styles = StyleSheet.create({
  backButton: {
    paddingLeft: 1,
  },
  cover: {
    alignItems: 'center',
    bottom: 0,
    height: '100%',
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
  },
  forwardButton: {
    paddingRight: 1,
  },
  navButton: {
    alignItems: 'center',
    height: TAB_BAR_PILL_HEIGHT,
    justifyContent: 'center',
    width: TAB_BAR_PILL_HEIGHT,
  },
  navButtonsBorder: {
    borderCurve: 'continuous',
    borderRadius: TAB_BAR_PILL_HEIGHT / 2,
    borderWidth: THICK_BORDER_WIDTH,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  navButtonsPill: {
    borderRadius: TAB_BAR_PILL_HEIGHT / 2,
    flexDirection: 'row',
    height: TAB_BAR_PILL_HEIGHT,
    width: TAB_BAR_PILL_WIDTH,
  },
});
