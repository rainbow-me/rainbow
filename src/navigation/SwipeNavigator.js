import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import React, { useMemo, useState } from 'react';
import { FlexItem } from '../components/layout';
import { TestnetToast } from '../components/toasts';
import { web3Provider } from '../handlers/web3';
import DiscoverScreen from '../screens/DiscoverScreen';
import ProfileScreen from '../screens/ProfileScreen';
import WalletScreen from '../screens/WalletScreen';
import { deviceUtils } from '../utils';
import ScrollPagerWrapper from './ScrollPagerWrapper';
import Routes from './routesNames';
import {
  useAccountProfile,
  useAccountSettings,
  useCoinListEdited,
  usePersistentDominantColorFromImage,
} from '@/hooks';
import { maybeSignUri } from '@/handlers/imgix';
import { Box, Columns, DebugLayout, Stack, Text } from '@/design-system';
import { ButtonPressAnimation } from '@/components/animations';

const Swipe = createMaterialTopTabNavigator();

const renderTabBar = () => null;

const renderPager = props => (
  <ScrollPagerWrapper {...props} initialScrollPosition={1} />
);

export function SwipeNavigator() {
  const { isCoinListEdited } = useCoinListEdited();
  const { network } = useAccountSettings();

  const { accountColor, accountImage, accountSymbol } = useAccountProfile();

  // ////////////////////////////////////////////////////
  // Colors

  const { result: dominantColor, state } = usePersistentDominantColorFromImage(
    maybeSignUri(accountImage ?? '') ?? ''
  );

  const { colors } = useTheme();
  let accentColor = colors.appleBlue;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  } else if (typeof accountColor === 'string') {
    accentColor = accountColor;
  }

  // ////////////////////////////////////////////////////
  // Animations

  const hasAvatarLoaded = !!accountImage || accountSymbol;
  const hasImageColorLoaded = state === 2 || state === 3;
  const hasLoaded = hasAvatarLoaded || hasImageColorLoaded;

  const TabBar = ({ state, descriptors, navigation }) => {
    return (
      <Box width="full" height={{ custom: 80 }} style={{backgroundColor: colors.white}}>
        <Columns alignVertical="center" space="12px">
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];

            const isFocused = state.index === index;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
                <Box key={route.key} height="full" width="full" justifyContent='flex-start' paddingTop='10px'>
                  <ButtonPressAnimation
                    onPress={onPress}
                    onLongPress={onLongPress}
                  >
                    <Stack alignVertical='center' alignHorizontal="center" space="10px">
                      <Box  alignItems="center" style={{backgroundColor: isFocused ? colors.alpha(accentColor, 0.3) : colors.transparent}} justifyContent="center" borderRadius={20} paddingVertical='12px' paddingHorizontal='28px'>
                        <Text color={{ custom: accentColor }} size="20pt" weight='semibold'>
                          {options.tabBarIcon}
                        </Text>
                      </Box>
                    </Stack>
                  </ButtonPressAnimation>
                </Box>
            );
          })}
        </Columns>
      </Box>
    );
  };

  return (
    <FlexItem>
      <Swipe.Navigator
        initialLayout={deviceUtils.dimensions}
        initialRouteName={Routes.WALLET_SCREEN}
        pager={renderPager}
        swipeEnabled={!isCoinListEdited}
        tabBar={props => <TabBar {...props} />}
        tabBarPosition='bottom'
      >
        <Swipe.Screen
          component={WalletScreen}
          name={Routes.WALLET_SCREEN}
          options={{ tabBarIcon: '􀎞' }}
        />
        <Swipe.Screen
          component={ProfileScreen}
          name={Routes.PROFILE_SCREEN}
          options={{ tabBarIcon: '􀐫' }}
        />
        <Swipe.Screen
          component={DiscoverScreen}
          name={Routes.DISCOVER_SCREEN}
          options={{ tabBarIcon: '􀊫' }}
        />
      </Swipe.Navigator>
      <TestnetToast network={network} web3Provider={web3Provider} />
    </FlexItem>
  );
}
