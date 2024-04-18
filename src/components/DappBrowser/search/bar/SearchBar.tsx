import React from 'react';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight, useDimensions } from '@/hooks';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { useBrowserContext } from '../../BrowserContext';
import { AccountIcon } from './AccountIcon';
import { SearchInput } from './SearchInput';
import { TabButton } from './TabButton';
import { useSearchContext } from '../SearchContext';

export const SEARCH_BAR_HEIGHT = 88;

export const SearchBar = () => {
  const { width: deviceWidth } = useDimensions();
  const { tabViewProgress, tabViewVisible } = useBrowserContext();
  const { inputRef, isFocused, setIsFocused } = useSearchContext();

  const isFocusedValue = useSharedValue(false);

  const keyboardHeight = useKeyboardHeight({ shouldListen: isFocused });

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocusedValue.value ? 0 : 1, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: isFocusedValue.value ? 'none' : 'auto',
  }));

  const barStyle = useAnimatedStyle(() => {
    const progress = tabViewProgress?.value ?? 0;

    return {
      opacity: 1 - progress / 75,
      paddingLeft: withSpring(isFocusedValue.value ? 16 : 72, SPRING_CONFIGS.keyboardConfig),
      pointerEvents: tabViewVisible?.value ? 'none' : 'auto',
      transform: [
        {
          scale: interpolate(progress, [0, 100], [1, 0.95]),
        },
      ],
    };
  });

  const bottomBarStyle = useAnimatedStyle(() => {
    const translateY = isFocusedValue.value ? -(keyboardHeight - (IS_IOS ? 82 : 46)) : 0;

    return {
      transform: [
        {
          translateY: withSpring(translateY, SPRING_CONFIGS.keyboardConfig),
        },
      ],
    };
  });

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[bottomBarStyle, { height: TAB_BAR_HEIGHT + SEARCH_BAR_HEIGHT, zIndex: 10000 }]}
      width={{ custom: deviceWidth }}
    >
      <Box
        as={Animated.View}
        paddingRight="16px"
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, barStyle]}
        width="full"
      >
        <Box as={Animated.View} position="absolute" style={[accountIconStyle, { left: 24 }]}>
          <AccountIcon />
        </Box>

        <Box paddingRight="12px" style={{ flex: 1 }}>
          <SearchInput isFocusedValue={isFocusedValue} />
        </Box>
        <TabButton inputRef={inputRef} isFocused={isFocused} isFocusedValue={isFocusedValue} setIsFocused={setIsFocused} />
      </Box>
    </Box>
  );
};
