import { BlurView } from '@react-native-community/blur';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, interpolate, Extrapolate } from 'react-native-reanimated';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { FlexItem } from '@/components/layout';
import { TestnetToast } from '@/components/toasts';
import { web3Provider } from '@/handlers/web3';
import DiscoverScreen, { discoverScrollToTopFnRef } from '../screens/discover/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { deviceUtils } from '../utils';
import { ScrollPositionContext } from './ScrollPositionContext';
import Routes from './routesNames';
import { useAccountAccentColor, useAccountSettings, useCoinListEdited, useDimensions } from '@/hooks';
import { Box, Columns, Stack } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';
import PointsScreen from '@/screens/points/PointsScreen';
import WalletScreen from '@/screens/WalletScreen';
import RecyclerListViewScrollToTopProvider, {
  useRecyclerListViewScrollToTopContext,
} from '@/navigation/RecyclerListViewScrollToTopContext';
import { discoverOpenSearchFnRef } from '@/screens/discover/components/DiscoverSearchContainer';
import { InteractionManager, View } from 'react-native';
import { IS_ANDROID, IS_IOS, IS_TEST } from '@/env';
import SectionListScrollToTopProvider, { useSectionListScrollToTopContext } from './SectionListScrollToTopContext';
import { isUsingButtonNavigation } from '@/helpers/statusBarHelper';
import { useRemoteConfig } from '@/model/remoteConfig';
import { useExperimentalFlag, POINTS } from '@/config';

const HORIZONTAL_TAB_BAR_INSET = 6;

const animationConfig = {
  animation: 'spring',
  config: {
    stiffness: 200,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
  },
};

const Swipe = createMaterialTopTabNavigator();

export const getHeaderHeight = () => {
  if (IS_IOS) {
    return 82;
  }

  if (!isUsingButtonNavigation()) {
    return 72;
  }

  return 48;
};

const TabBar = ({ state, descriptors, navigation, position, jumpTo, lastPress, setLastPress }) => {
  const { width: deviceWidth } = useDimensions();
  const { colors, isDarkMode } = useTheme();

  const { points_enabled } = useRemoteConfig();

  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  const NUMBER_OF_TABS = showPointsTab ? 4 : 3;
  const tabWidth = (deviceWidth - HORIZONTAL_TAB_BAR_INSET * 2) / NUMBER_OF_TABS;
  const tabPillStartPosition = (tabWidth - 72) / 2 + HORIZONTAL_TAB_BAR_INSET;

  const { accentColor } = useAccountAccentColor();
  const recyclerList = useRecyclerListViewScrollToTopContext();
  const sectionList = useSectionListScrollToTopContext();

  const reanimatedPosition = useSharedValue(0);
  const pos1 = useSharedValue(tabPillStartPosition);
  const pos2 = useSharedValue(tabPillStartPosition + tabWidth);
  const pos3 = useSharedValue(tabPillStartPosition + tabWidth * 2);
  const pos4 = useSharedValue(tabPillStartPosition + tabWidth * 3);

  useEffect(() => {
    pos1.value = tabPillStartPosition;
    pos2.value = tabPillStartPosition + tabWidth;
    pos3.value = tabPillStartPosition + tabWidth * 2;
    pos4.value = tabPillStartPosition + tabWidth * 3;
  }, [pos1, pos2, pos3, pos4, tabPillStartPosition, tabWidth]);

  const tabStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      reanimatedPosition.value,
      [0, 1, 2, 3],
      [pos1.value, pos2.value, pos3.value, pos4.value],
      Extrapolate.EXTEND
    );
    return {
      transform: [{ translateX }],
      width: 72,
    };
  });

  useLayoutEffect(() => {
    if (reanimatedPosition.value !== state.index) {
      reanimatedPosition.value = state.index;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  const [canSwitch, setCanSwitch] = useState(true);

  // for when QRScannerScreen is re-added
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

  const ShadowWrapper = ({ children }) => {
    return IS_ANDROID ? (
      children
    ) : (
      <Box
        as={Animated.View}
        style={[
          // offScreenTabBar,
          {
            shadowColor: colors.shadowBlack,
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 20,
          },
        ]}
      >
        <Box
          style={{
            shadowColor: colors.shadowBlack,
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 3,
          }}
        >
          {children}
        </Box>
      </Box>
    );
  };

  return (
    <ShadowWrapper>
      <Box
        height={{ custom: getHeaderHeight() }}
        position="absolute"
        style={{
          bottom: 0,
          overflow: 'hidden',
        }}
        width="full"
      >
        <Box
          as={IS_IOS ? BlurView : View}
          blurAmount={40}
          blurType={isDarkMode ? 'chromeMaterialDark' : 'chromeMaterialLight'}
          width="full"
          height={{ custom: getHeaderHeight() }}
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
            style={[
              tabStyle,
              {
                backgroundColor: colors.alpha(accentColor, isDarkMode ? 0.25 : 0.1),
                top: 6,
              },
            ]}
            justifyContent="center"
            height="36px"
            borderRadius={18}
            position="absolute"
            width="72px"
          />
          <Box
            height="1px"
            position="absolute"
            style={{
              backgroundColor: isDarkMode ? colors.alpha('#ffffff', 0.4) : colors.alpha(colors.white, 0.5),
              top: 0,
            }}
            width="full"
          />
          <Box paddingHorizontal="6px">
            <Columns alignVertical="center">
              {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                  if (!canSwitch) return;

                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                  });

                  const time = new Date().getTime();
                  const delta = time - lastPress;

                  const DOUBLE_PRESS_DELAY = 400;

                  if (!isFocused && !event.defaultPrevented) {
                    setCanSwitch(false);
                    jumpTo(route.key);
                    reanimatedPosition.value = index;
                    setTimeout(() => {
                      setCanSwitch(true);
                    }, 10);
                  } else if (isFocused && options.tabBarIcon === 'tabDiscover') {
                    if (delta < DOUBLE_PRESS_DELAY) {
                      discoverOpenSearchFnRef?.();
                      return;
                    }

                    if (discoverScrollToTopFnRef?.() === 0) {
                      discoverOpenSearchFnRef?.();
                      return;
                    }
                  } else if (isFocused && options.tabBarIcon === 'tabHome') {
                    recyclerList.scrollToTop?.();
                  } else if (isFocused && options.tabBarIcon === 'tabActivity') {
                    sectionList.scrollToTop?.();
                  }

                  setLastPress(time);
                };

                const onLongPress = async () => {
                  navigation.emit({
                    type: 'tabLongPress',
                    target: route.key,
                  });

                  if (options.tabBarIcon === 'tabHome') {
                    navigation.navigate(Routes.CHANGE_WALLET_SHEET);
                  }
                  if (options.tabBarIcon === 'tabDiscover') {
                    navigation.navigate(Routes.DISCOVER_SCREEN);
                    InteractionManager.runAfterInteractions(() => {
                      discoverOpenSearchFnRef?.();
                    });
                  }
                };

                return (
                  options.tabBarIcon !== 'none' && (
                    <Box
                      key={route.key}
                      height="full"
                      width="full"
                      justifyContent="flex-start"
                      paddingTop="6px"
                      testID={`tab-bar-icon-${route.name}`}
                    >
                      <ButtonPressAnimation onPress={onPress} onLongPress={onLongPress} disallowInterruption scaleTo={0.75}>
                        <Stack alignVertical="center" alignHorizontal="center">
                          <Box alignItems="center" justifyContent="center" height="36px" borderRadius={20}>
                            <TabBarIcon
                              accentColor={accentColor}
                              icon={options.tabBarIcon}
                              index={index}
                              rawScrollPosition={position}
                              reanimatedPosition={reanimatedPosition}
                            />
                          </Box>
                        </Stack>
                      </ButtonPressAnimation>
                    </Box>
                  )
                );
              })}
            </Columns>
          </Box>
        </Box>
      </Box>
    </ShadowWrapper>
  );
};

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { network } = useAccountSettings();
  const { colors } = useTheme();

  const [lastPress, setLastPress] = useState();

  const { points_enabled } = useRemoteConfig();

  const showPointsTab = useExperimentalFlag(POINTS) || points_enabled || IS_TEST;

  // ////////////////////////////////////////////////////
  // Animations

  return (
    <FlexItem backgroundColor={colors.white}>
      <SectionListScrollToTopProvider>
        <RecyclerListViewScrollToTopProvider>
          <ScrollPositionContext.Provider>
            <Swipe.Navigator
              initialLayout={deviceUtils.dimensions}
              initialRouteName={Routes.WALLET_SCREEN}
              screenOptions={{
                animationEnabled: false,
              }}
              swipeEnabled={!isCoinListEdited || IS_TEST}
              tabBar={props => <TabBar {...props} lastPress={lastPress} setLastPress={setLastPress} />}
              tabBarPosition="bottom"
            >
              {/* <Swipe.Screen
                  component={QRScannerScreen}
                  name={Routes.QR_SCANNER_SCREEN}
                  options={{
                    tabBarIcon: 'none',
                  }}
                /> */}
              <Swipe.Screen
                component={WalletScreen}
                name={Routes.WALLET_SCREEN}
                options={{
                  tabBarIcon: 'tabHome',
                  transitionSpec: {
                    open: animationConfig,
                    close: animationConfig,
                  },
                }}
              />
              <Swipe.Screen component={DiscoverScreen} name={Routes.DISCOVER_SCREEN} options={{ tabBarIcon: 'tabDiscover' }} />
              <Swipe.Screen component={ProfileScreen} name={Routes.PROFILE_SCREEN} options={{ tabBarIcon: 'tabActivity' }} />
              {showPointsTab && <Swipe.Screen component={PointsScreen} name={Routes.POINTS_SCREEN} options={{ tabBarIcon: 'tabPoints' }} />}
            </Swipe.Navigator>
          </ScrollPositionContext.Provider>
        </RecyclerListViewScrollToTopProvider>
      </SectionListScrollToTopProvider>

      <TestnetToast network={network} web3Provider={web3Provider} />
    </FlexItem>
  );
}
