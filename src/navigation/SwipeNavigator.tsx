import { LIGHT_SEPARATOR_COLOR } from '@/__swaps__/screens/Swap/constants';
import { BrowserTabViewProgressContextProvider, useBrowserTabViewProgressContext } from '@/components/DappBrowser/BrowserContext';
import { ButtonPressAnimation } from '@/components/animations';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { FlexItem } from '@/components/layout';
import { TestnetToast } from '@/components/toasts';
import { DAPP_BROWSER, POINTS, useExperimentalFlag } from '@/config';
import { Box, Columns, globalColors, Stack, useForegroundColor, Text, Cover, useColorMode } from '@/design-system';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { web3Provider } from '@/handlers/web3';
import { isUsingButtonNavigation } from '@/helpers/statusBarHelper';
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
import { deviceUtils } from '@/utils';
import { BlurView } from '@react-native-community/blur';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import { MaterialTopTabDescriptorMap } from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { NavigationHelpers, ParamListBase, RouteProp } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef } from 'react';
import { InteractionManager, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { AnimatedSpinner } from '@/components/animations/AnimatedSpinner';
import DiscoverScreen, { discoverScrollToTopFnRef } from '../screens/discover/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import Routes from './routesNames';
import { ScrollPositionContext } from './ScrollPositionContext';
import SectionListScrollToTopProvider, { useSectionListScrollToTopContext } from './SectionListScrollToTopContext';
import { TextSize } from '@/design-system/components/Text/Text';

export const TAB_BAR_HEIGHT = getTabBarHeight();

function getTabBarHeight() {
  if (IS_IOS) {
    return 82;
  }
  if (!isUsingButtonNavigation()) {
    return 72;
  }
  return 48;
}

const HORIZONTAL_TAB_BAR_INSET = 6;
const HORIZONTAL_TAB_BAR_INSET_5_TABS = 10;

const fadeConfig = { duration: 300, easing: Easing.bezier(0.22, 1, 0.36, 1) };

const Swipe = createMaterialTopTabNavigator();

// eslint-disable-next-line react/display-name
const ActivityTabIcon = React.memo(
  ({
    accentColor,
    tabBarIcon,
    index,
    reanimatedPosition,
  }: {
    accentColor: string;
    tabBarIcon: string;
    index: number;
    reanimatedPosition: SharedValue<number>;
  }) => {
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
      <Box width={{ custom: 28 }} height={{ custom: 28 }} alignItems="center" justifyContent="center">
        <AnimatedSpinner color={accentColor} isLoading requireSrc={require('@/assets/tabSpinner.png')} size={28} />
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
  }
);

interface TabBarProps {
  descriptors: MaterialTopTabDescriptorMap;
  jumpTo: (key: string) => void;
  navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
  state: { index: number; routes: RouteProp<ParamListBase, string>[] };
}

const TabBar = ({ descriptors, jumpTo, navigation, state }: TabBarProps) => {
  const { highContrastAccentColor: accentColor } = useAccountAccentColor();
  const { tabViewProgress } = useBrowserTabViewProgressContext();
  const { isDarkMode } = useColorMode();
  const { width: deviceWidth } = useDimensions();
  const { colors } = useTheme();
  const recyclerList = useRecyclerListViewScrollToTopContext();
  const sectionList = useSectionListScrollToTopContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');

  const { dapp_browser, points_enabled } = useRemoteConfig();
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  const numberOfTabs = 3 + (showPointsTab ? 1 : 0) + (showDappBrowserTab ? 1 : 0);
  const horizontalInset = numberOfTabs > 4 ? HORIZONTAL_TAB_BAR_INSET_5_TABS : HORIZONTAL_TAB_BAR_INSET;
  const tabWidth = (deviceWidth - horizontalInset * 2) / numberOfTabs;
  const tabPillStartPosition = (tabWidth - 72) / 2 + horizontalInset;

  const reanimatedPosition = useSharedValue(0);

  const tabPositions = useDerivedValue(() => {
    const inputRange = Array.from({ length: numberOfTabs }, (_, index) => index);
    const outputRange = Array.from({ length: numberOfTabs }, (_, index) => tabPillStartPosition + tabWidth * index);
    return { inputRange, outputRange };
  });

  const tabStyle = useAnimatedStyle(() => {
    const translateX = interpolate(reanimatedPosition.value, tabPositions.value.inputRange, tabPositions.value.outputRange, 'clamp');
    return {
      transform: [{ translateX }],
      width: 72,
    };
  });

  const dappBrowserTabBarStyle = useAnimatedStyle(() => {
    const shouldUseBrowserStyle = showDappBrowserTab && reanimatedPosition.value === 2;
    return {
      borderTopColor: isDarkMode ? separatorSecondary : LIGHT_SEPARATOR_COLOR,
      borderTopWidth: withTiming(shouldUseBrowserStyle ? 1 : 0, fadeConfig),
      opacity: withTiming(shouldUseBrowserStyle ? 1 : 0, fadeConfig),
    };
  });

  const dappBrowserTabBarShadowStyle = useAnimatedStyle(() => {
    const defaultShadowOpacity = isDarkMode ? 0.2 : 0.04;
    const shadowOpacity = showDappBrowserTab && reanimatedPosition.value === 2 ? 0 : defaultShadowOpacity;
    return {
      shadowOpacity: withTiming(shadowOpacity, fadeConfig),
    };
  });

  const hideForBrowserTabViewStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress.value || 0;
    const opacity = 1 - progress / 75;
    const pointerEvents = opacity < 1 ? 'none' : 'auto';

    return {
      opacity,
      pointerEvents,
      transform: [
        {
          translateY: interpolate(progress, [0, 100], [0, 28]),
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

        return (
          <Box
            height="full"
            key={route.key}
            justifyContent="flex-start"
            paddingTop="6px"
            testID={`tab-bar-icon-${route.name}`}
            width="full"
          >
            <ButtonPressAnimation
              disallowInterruption
              minLongPressDuration={300}
              onLongPress={() => onLongPress(route, tabBarIcon)}
              onPress={() => onPress(route, index, isFocused, tabBarIcon)}
              scaleTo={0.75}
            >
              <Stack alignHorizontal="center">
                <Box alignItems="center" borderRadius={20} height="36px" justifyContent="center">
                  {tabBarIcon === 'tabActivity' ? (
                    <ActivityTabIcon
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
            </ButtonPressAnimation>
          </Box>
        );
      }),
    [accentColor, descriptors, onLongPress, onPress, reanimatedPosition, state.index, state.routes]
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
              style={[dappBrowserTabBarStyle, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }]}
              width="full"
            />
            <Box
              alignItems="center"
              as={Animated.View}
              borderRadius={18}
              height="36px"
              justifyContent="center"
              position="absolute"
              style={[
                tabStyle,
                {
                  backgroundColor: colors.alpha(accentColor, isDarkMode ? 0.25 : 0.1),
                  top: 6,
                },
              ]}
              width={{ custom: 72 }}
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
      screenOptions={{
        animationEnabled: false,
        swipeEnabled: !isCoinListEdited || IS_TEST,
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
  const { network } = useAccountSettings();
  const { colors } = useTheme();

  return (
    <FlexItem backgroundColor={colors.white}>
      <BrowserTabViewProgressContextProvider>
        <SectionListScrollToTopProvider>
          <RecyclerListViewScrollToTopProvider>
            {/* @ts-expect-error JS component */}
            <ScrollPositionContext.Provider>
              <SwipeNavigatorScreens />
            </ScrollPositionContext.Provider>
          </RecyclerListViewScrollToTopProvider>
        </SectionListScrollToTopProvider>
      </BrowserTabViewProgressContextProvider>

      <TestnetToast network={network} web3Provider={web3Provider} />
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
