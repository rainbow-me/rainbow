import { BlurView } from '@react-native-community/blur';
import { createMaterialTopTabNavigator, MaterialTopTabNavigationEventMap } from '@react-navigation/material-top-tabs';
import { MaterialTopTabDescriptorMap } from '@react-navigation/material-top-tabs/lib/typescript/src/types';
import { NavigationHelpers, ParamListBase, RouteProp } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { InteractionManager, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, interpolate } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { FlexItem } from '@/components/layout';
import { TestnetToast } from '@/components/toasts';
import { useExperimentalFlag, DAPP_BROWSER, POINTS } from '@/config';
import { Box, Columns, Stack, globalColors } from '@/design-system';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import { web3Provider } from '@/handlers/web3';
import { isUsingButtonNavigation } from '@/helpers/statusBarHelper';
import { useAccountAccentColor, useAccountSettings, useCoinListEdited, useDimensions } from '@/hooks';
import { useRemoteConfig } from '@/model/remoteConfig';
import RecyclerListViewScrollToTopProvider, {
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import WalletScreen from '@/screens/WalletScreen';
import DappBrowserScreen from '@/screens/dapp-browser/DappBrowserScreen';
import { discoverOpenSearchFnRef } from '@/screens/discover/components/DiscoverSearchContainer';
import PointsScreen from '@/screens/points/PointsScreen';
import { useTheme } from '@/theme';
import { deviceUtils } from '@/utils';

import ProfileScreen from '../screens/ProfileScreen';
import DiscoverScreen, { discoverScrollToTopFnRef } from '../screens/discover/DiscoverScreen';
import { ScrollPositionContext } from './ScrollPositionContext';
import SectionListScrollToTopProvider, { useSectionListScrollToTopContext } from './SectionListScrollToTopContext';
import Routes from './routesNames';

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
const Swipe = createMaterialTopTabNavigator();

interface TabBarProps {
  descriptors: MaterialTopTabDescriptorMap;
  jumpTo: (key: string) => void;
  navigation: NavigationHelpers<ParamListBase, MaterialTopTabNavigationEventMap>;
  state: { index: number; routes: RouteProp<ParamListBase, string>[] };
}

const TabBar = ({ descriptors, jumpTo, navigation, state }: TabBarProps) => {
  const { accentColor } = useAccountAccentColor();
  const { width: deviceWidth } = useDimensions();
  const { colors, isDarkMode } = useTheme();
  const recyclerList = useRecyclerListViewScrollToTopContext();
  const sectionList = useSectionListScrollToTopContext();

  const { dapp_browser, points_enabled } = useRemoteConfig();
  const showDappBrowserTab = useExperimentalFlag(DAPP_BROWSER) || dapp_browser;
  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  const numberOfTabs = 3 + (showPointsTab ? 1 : 0) + (showDappBrowserTab ? 1 : 0);
  const tabWidth = (deviceWidth - HORIZONTAL_TAB_BAR_INSET * 2) / numberOfTabs;
  const tabPillStartPosition = (tabWidth - 72) / 2 + HORIZONTAL_TAB_BAR_INSET;

  const reanimatedPosition = useSharedValue(0);

  const tabPositions = useMemo(() => {
    const inputRange = Array.from({ length: numberOfTabs }, (_, index) => index);
    const outputRange = Array.from({ length: numberOfTabs }, (_, index) => tabPillStartPosition + tabWidth * index);
    return { inputRange, outputRange };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numberOfTabs]);

  const tabStyle = useAnimatedStyle(() => {
    const translateX = interpolate(reanimatedPosition.value, tabPositions.inputRange, tabPositions.outputRange, 'clamp');
    return {
      transform: [{ translateX }],
      width: 72,
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

  useLayoutEffect(() => {
    reanimatedPosition.value = state.index;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canSwitchRef, jumpTo, navigation, recyclerList, sectionList]
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
                  <TabBarIcon accentColor={accentColor} icon={tabBarIcon} index={index} reanimatedPosition={reanimatedPosition} />
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
    <Box bottom={{ custom: 0 }} height={{ custom: TAB_BAR_HEIGHT }} position="absolute" width="full">
      <Box style={shadowStyles.outer}>
        <Box style={shadowStyles.inner}>
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
            <Box paddingHorizontal="6px">
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
      <SectionListScrollToTopProvider>
        <RecyclerListViewScrollToTopProvider>
          {/* @ts-expect-error JS component */}
          <ScrollPositionContext.Provider>
            <SwipeNavigatorScreens />
          </ScrollPositionContext.Provider>
        </RecyclerListViewScrollToTopProvider>
      </SectionListScrollToTopProvider>

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
