import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight } from '@/hooks';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useBrowserContext } from '../BrowserContext';
import { GOOGLE_SEARCH_URL, HTTP, HTTPS } from '../constants';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { isValidURL, isValidURLWorklet } from '../utils';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { SearchResults } from './results/SearchResults';
import { useSearchContext } from './SearchContext';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';

export const Search = () => {
  const { goToUrl, searchViewProgress, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { toggleTabViewWorklet } = useBrowserWorkletsContext();
  const { inputRef, keyboardHeight, searchQuery, searchResults } = useSearchContext();

  const { isDarkMode } = useColorMode();

  const isFocusedValue = useSharedValue(false);

  const barStyle = useAnimatedStyle(() => {
    const opacity = 1 - tabViewProgress.value / 75;
    return {
      opacity,
      pointerEvents: tabViewVisible.value ? 'none' : 'auto',
    };
  });

  const expensiveBarStyles = useAnimatedStyle(() => ({
    paddingLeft: withSpring(isFocusedValue.value ? 16 : 72, SPRING_CONFIGS.slowSpring),
    pointerEvents: tabViewVisible?.value ? 'none' : 'auto',
  }));

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocusedValue.value ? 0 : 1, SPRING_CONFIGS.slowSpring),
    pointerEvents: isFocusedValue.value ? 'none' : 'auto',
  }));

  const bottomBarStyle = useAnimatedStyle(() => {
    const translateY = isFocusedValue.value ? -(keyboardHeight.value - (IS_IOS ? 82 : 46)) : 0;

    return {
      transform: [
        {
          translateY: withSpring(translateY, SPRING_CONFIGS.slowSpring),
        },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress.value,
    pointerEvents: isFocusedValue.value ? 'auto' : 'none',
    zIndex: searchViewProgress.value ? 1 : -1,
  }));

  // ⚠️ TODO: Consolidate these duplicate functions
  const handleUrlSubmit = useCallback(
    (updatedUrl: string) => {
      let newUrl = updatedUrl;

      if (!isValidURL(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }

      inputRef.current?.blur();
      goToUrl(newUrl);
    },
    [goToUrl, inputRef]
  );

  // ⚠️ TODO: Consolidate these duplicate functions
  const handleUrlSubmitWorklet = useCallback(
    (updatedUrl: string) => {
      'worklet';
      let newUrl = updatedUrl;

      if (searchResults.value.length > 0 && searchResults.value[0].url) {
        newUrl = searchResults.value[0].url;
      }

      if (!isValidURLWorklet(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }

      runOnJS(goToUrl)(newUrl);
    },
    [goToUrl, searchResults]
  );

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, [inputRef]);

  const onAddressInputPressWorklet = useCallback(() => {
    'worklet';
    isFocusedValue.value = true;
    searchViewProgress.value = withSpring(1, SPRING_CONFIGS.snappierSpringConfig);
    runOnJS(focusInput)();
  }, [focusInput, isFocusedValue, searchViewProgress]);

  const onBlur = useCallback(() => {
    'worklet';
    searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    isFocusedValue.value = false;
    searchQuery.value = '';
  }, [isFocusedValue, searchQuery, searchViewProgress]);

  return (
    <>
      <KeyboardHeightSetter isFocused={isFocusedValue} />
      <Animated.View style={[backgroundStyle, styles.searchBackground, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }]}>
        <SearchResults goToUrl={handleUrlSubmit} isFocused={isFocusedValue} />
      </Animated.View>
      <Animated.View style={[bottomBarStyle, styles.bottomBarStyle]}>
        <Animated.View style={[styles.barStyle, barStyle, expensiveBarStyles]}>
          <Animated.View style={[accountIconStyle, styles.accountIcon]}>
            <AccountIcon />
          </Animated.View>

          <View style={styles.searchInputContainer}>
            <SearchInput
              canGoBack={true}
              canGoForward={true}
              onPressWorklet={onAddressInputPressWorklet}
              isFocusedValue={isFocusedValue}
              inputRef={inputRef}
              onBlur={onBlur}
              onSubmitEditing={handleUrlSubmitWorklet}
            />
          </View>
          <TabButton inputRef={inputRef} isFocusedValue={isFocusedValue} toggleTabViewWorklet={toggleTabViewWorklet} />
        </Animated.View>
      </Animated.View>
    </>
  );
};

const KeyboardHeightSetter = ({ isFocused }: { isFocused: SharedValue<boolean> }) => {
  const { keyboardHeight } = useSearchContext();

  const isFocusedState = useSharedValueState(isFocused);
  const trueKeyboardHeight = useKeyboardHeight({ shouldListen: isFocusedState });

  useSyncSharedValue({
    sharedValue: keyboardHeight,
    state: trueKeyboardHeight,
    syncDirection: 'stateToSharedValue',
  });

  return null;
};

const styles = StyleSheet.create({
  accountIcon: {
    left: 24,
    position: 'absolute',
  },
  barStyle: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    paddingRight: 16,
    width: '100%',
  },
  bottomBarStyle: {
    bottom: 0,
    height: TAB_BAR_HEIGHT + 88,
    paddingTop: 20,
    pointerEvents: 'box-none',
    position: 'absolute',
    width: DEVICE_WIDTH,
    zIndex: 10000,
  },
  searchBackground: {
    height: '100%',
    position: 'absolute',
    width: '100%',
  },
  searchInputContainer: {
    flex: 1,
    paddingRight: 12,
  },
});
