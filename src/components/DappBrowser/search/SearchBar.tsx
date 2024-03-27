import React from 'react';
import { Box } from '@/design-system';
import Animated, { Easing, interpolate, useAnimatedKeyboard, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { useBrowserContext } from '../BrowserContext';
import { AccountIcon } from '../search-input/AccountIcon';
import { TabButton } from '../search-input/TabButton';
import { SearchInput } from '../search-input/SearchInput';
import useDimensions from '@/hooks/useDimensions';
import { IS_IOS } from '@/env';

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

export const SearchBar = () => {
  const { tabViewProgress, toggleTabView, isSearchInputFocused, searchViewProgress } = useBrowserContext();

  const keyboard = useAnimatedKeyboard();
  const { width: deviceWidth } = useDimensions();

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    paddingLeft: withTiming(72 - 56 * (searchViewProgress?.value ?? 0), timingConfig),
    pointerEvents: (tabViewProgress?.value ?? 0) < 1 ? 'auto' : 'none',
    transform: [
      {
        translateY: interpolate(tabViewProgress?.value ?? 0, [0, 1], [0, 68], 'clamp'),
      },
      {
        scale: interpolate(tabViewProgress?.value ?? 0, [0, 1], [1, 0.9], 'clamp'),
      },
    ],
  }));

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - (searchViewProgress?.value ?? 0),
  }));

  const bottomBarStyle = useAnimatedStyle(() => {
    return {
      height: TAB_BAR_HEIGHT + 88,
      transform: [{ translateY: Math.min(-(keyboard.height.value - (IS_IOS ? 82 : 46)), 0) }],
    };
  }, [tabViewProgress, keyboard.height]);

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[bottomBarStyle, { zIndex: 10000, opacity: 1 }]}
      width={{ custom: deviceWidth }}
    >
      <Box
        as={Animated.View}
        paddingRight="16px"
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, barStyle]}
        width="full"
      >
        <Box
          as={Animated.View}
          position="absolute"
          style={[accountIconStyle, { left: 16, pointerEvents: isSearchInputFocused ? 'none' : 'auto' }]}
        >
          <AccountIcon />
        </Box>
        <Box paddingRight="12px" style={{ flex: 1 }}>
          <SearchInput />
        </Box>
        <TabButton toggleTabView={toggleTabView} />
      </Box>
    </Box>
  );
};
