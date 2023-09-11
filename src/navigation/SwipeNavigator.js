import { BlurView } from '@react-native-community/blur';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { TabBarIcon } from '@/components/icons/TabBarIcon';
import { FlexItem } from '@/components/layout';
import { TestnetToast } from '@/components/toasts';
import { web3Provider } from '@/handlers/web3';
import DiscoverScreen, {
  discoverScrollToTopFnRef,
} from '../screens/discover/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import QRScannerScreen from '../screens/QRScannerScreen';
import { deviceUtils } from '../utils';
import {
  ScrollPositionContext,
  usePagerPosition,
} from './ScrollPositionContext';
import Routes from './routesNames';
import {
  useAccountAccentColor,
  useAccountSettings,
  useCoinListEdited,
  useDimensions,
} from '@/hooks';
import { Box, Columns, Stack } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';

import logger from 'logger';
import WalletScreen from '@/screens/WalletScreen';
import { discoverOpenSearchFnRef } from '@/screens/discover/components/DiscoverSearchContainer';
import { InteractionManager } from 'react-native';

const NUMBER_OF_TABS = 3;

const config = {
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

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { network } = useAccountSettings();

  const { accentColor } = useAccountAccentColor();

  // ////////////////////////////////////////////////////
  // Colors

  const { colors, isDarkMode } = useTheme();

  // ////////////////////////////////////////////////////
  // Animations

  const TabBar = ({ state, descriptors, navigation, position }) => {
    const { width: deviceWidth } = useDimensions();
    const reanimatedPosition = useSharedValue(1);
    const tabWidth = deviceWidth / NUMBER_OF_TABS;
    const tabPillStartPosition = (tabWidth - 72) / 2;
    console.log('reanimatedposition', reanimatedPosition.value);

    const tabStyle = useAnimatedStyle(() => {
      const pos1 = tabPillStartPosition;
      const pos2 = tabPillStartPosition + tabWidth;
      const pos3 = tabPillStartPosition + tabWidth * 2;
      console.log('pos1', pos1, pos2);
      const translateX = interpolate(
        reanimatedPosition.value,
        [1, 2, 3],
        [pos1, pos2, pos3],
        Extrapolate.CLAMP
      );
      return {
        transform: [{ translateX }],
        width: 72,
      };
    });

    const offScreenTabBar = useAnimatedStyle(() => {
      const translateX = interpolate(
        reanimatedPosition.value,
        [0, 1, 2],
        [deviceWidth, 0, 0]
      );
      return {
        transform: [
          {
            translateX,
          },
        ],
      };
    });
    return (
      <Box
        as={Animated.View}
        style={[
          offScreenTabBar,
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
          <Box
            height={{ custom: 82 }}
            position="absolute"
            style={{
              bottom: 0,
              overflow: 'hidden',
            }}
            width="full"
          >
            <Box
              as={BlurView}
              blurAmount={40}
              blurType={
                isDarkMode ? 'chromeMaterialDark' : 'chromeMaterialLight'
              }
              width="full"
              height={{ custom: 82 }}
            >
              <Box
                height="full"
                position="absolute"
                style={{
                  backgroundColor: isDarkMode
                    ? colors.alpha('#191A1C', 0.7)
                    : colors.alpha(colors.white, 0.7),
                }}
                width="full"
              />
              <Box
                alignItems="center"
                as={Animated.View}
                style={[
                  tabStyle,
                  {
                    backgroundColor: colors.alpha(
                      accentColor,
                      isDarkMode ? 0.25 : 0.1
                    ),
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
                  backgroundColor: isDarkMode
                    ? colors.alpha('#ffffff', 0.4)
                    : colors.alpha(colors.white, 0.5),
                  top: 0,
                }}
                width="full"
              />
              <Columns alignVertical="center">
                {state.routes.map((route, index) => {
                  const { options } = descriptors[route.key];
                  logger.log('routeKey = ' + route.key);

                  const isFocused = state.index === index;

                  const onPress = () => {
                    const event = navigation.emit({
                      type: 'tabPress',
                      target: route.key,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                      navigation.navigate(route.name);
                      reanimatedPosition.value = index;
                    } else if (
                      isFocused &&
                      options.tabBarIcon === 'tabDiscover'
                    ) {
                      discoverScrollToTopFnRef?.();
                    }
                  };

                  const onLongPress = async () => {
                    navigation.emit({
                      type: 'tabLongPress',
                      target: route.key,
                    });
                    reanimatedPosition.value = index;

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
                      >
                        <ButtonPressAnimation
                          onPress={onPress}
                          onLongPress={onLongPress}
                          scaleTo={0.75}
                        >
                          <Stack
                            alignVertical="center"
                            alignHorizontal="center"
                          >
                            <Box
                              alignItems="center"
                              justifyContent="center"
                              height="36px"
                              borderRadius={20}
                            >
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
      </Box>
    );
  };

  return (
    <FlexItem>
      <ScrollPositionContext.Provider>
        <Swipe.Navigator
          initialLayout={deviceUtils.dimensions}
          initialRouteName={Routes.WALLET_SCREEN}
          swipeEnabled={!isCoinListEdited}
          tabBar={props => <TabBar {...props} />}
          tabBarPosition="bottom"
        >
          <Swipe.Screen
            component={QRScannerScreen}
            name={Routes.QR_SCANNER_SCREEN}
            options={{
              tabBarIcon: 'none',
            }}
          />
          <Swipe.Screen
            component={WalletScreen}
            name={Routes.WALLET_SCREEN}
            options={{
              tabBarIcon: 'tabHome',
              transitionSpec: {
                open: config,
                close: config,
              },
            }}
          />
          <Swipe.Screen
            component={ProfileScreen}
            name={Routes.PROFILE_SCREEN}
            options={{ tabBarIcon: 'tabActivity' }}
          />
          <Swipe.Screen
            component={DiscoverScreen}
            name={Routes.DISCOVER_SCREEN}
            options={{ tabBarIcon: 'tabDiscover' }}
          />
        </Swipe.Navigator>
      </ScrollPositionContext.Provider>
      <TestnetToast network={network} web3Provider={web3Provider} />
    </FlexItem>
  );
}
