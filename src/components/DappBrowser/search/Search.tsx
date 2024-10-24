import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { dispatchCommand, runOnJS, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight } from '@/hooks';
import { useSharedValueState } from '@/hooks/reanimated/useSharedValueState';
import { useSyncSharedValue } from '@/hooks/reanimated/useSyncSharedValue';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from '../BrowserContext';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';
import { BOTTOM_BAR_HEIGHT } from '../Dimensions';
import { GOOGLE_SEARCH_URL, HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, HTTP, HTTPS } from '../constants';
import { useTabViewGestures } from '../hooks/useTabViewGestures';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { isValidURLWorklet } from '../utils';
import { useSearchContext } from './SearchContext';
import { SearchResults } from './results/SearchResults';

export const Search = () => {
  const {
    extraWebViewHeight,
    goToUrl,
    isSwitchingTabs,
    resetScrollHandlers,
    searchViewProgress,
    shouldCollapseBottomBar,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { toggleTabViewWorklet } = useBrowserWorkletsContext();
  const { inputRef, isFocused, keyboardHeight, searchQuery, searchResults } = useSearchContext();
  const { isDarkMode } = useColorMode();

  const { tabViewGestureHandler } = useTabViewGestures();

  const barStyle = useAnimatedStyle(() => {
    const opacity = 1 - tabViewProgress.value / 75;
    return { opacity };
  });

  const expensiveBarStyles = useAnimatedStyle(() => ({
    paddingLeft: withSpring(isFocused.value ? 16 : 72, SPRING_CONFIGS.slowSpring),
    pointerEvents: tabViewVisible?.value ? 'none' : 'auto',
  }));

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocused.value ? 0 : 1, SPRING_CONFIGS.slowSpring),
    pointerEvents: isFocused.value ? 'none' : 'auto',
  }));

  const bottomBarStyle = useAnimatedStyle(() => {
    const translateY = isFocused.value ? -(keyboardHeight.value - (IS_IOS ? TAB_BAR_HEIGHT : 46) + extraWebViewHeight.value) : 0;

    return {
      transform: [
        {
          translateY: withSpring(translateY, SPRING_CONFIGS.slowSpring),
        },
        {
          translateY: extraWebViewHeight.value,
        },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress.value / 100,
    pointerEvents: isFocused.value ? 'auto' : 'none',
    zIndex: searchViewProgress.value ? 1 : -1,
  }));

  const tapToExpandBottomBarStyle = useAnimatedStyle(() => {
    const enabled = shouldCollapseBottomBar.value && !tabViewVisible.value && !isFocused.value;
    return {
      pointerEvents: enabled ? 'auto' : 'none',
    };
  });

  const tapToExpandGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(5)
        .onEnd(() => {
          if (shouldCollapseBottomBar.value && !isSwitchingTabs.value) {
            shouldCollapseBottomBar.value = false;
          }
          runOnJS(resetScrollHandlers)();
        })
        .shouldCancelWhenOutside(true),
    [isSwitchingTabs, resetScrollHandlers, shouldCollapseBottomBar]
  );

  const handleUrlSubmit = useCallback(
    ({ shouldBlur, updatedUrl }: { shouldBlur: boolean; updatedUrl: string }) => {
      let newUrl = updatedUrl;

      if (!shouldBlur && searchQuery.value && searchResults.value.length > 0 && searchResults.value[0].url) {
        newUrl = searchResults.value[0].url;
      }

      if (!isValidURLWorklet(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }

      if (shouldBlur) inputRef.current?.blur();
      goToUrl(newUrl);
    },
    [goToUrl, inputRef, searchQuery, searchResults]
  );

  const onAddressInputPressWorklet = useCallback(() => {
    'worklet';
    dispatchCommand(inputRef, 'focus');
    searchViewProgress.value = withSpring(100, SPRING_CONFIGS.snappierSpringConfig);
    isFocused.value = true;
  }, [inputRef, isFocused, searchViewProgress]);

  const onBlurWorklet = useCallback(() => {
    'worklet';
    searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    isFocused.value = false;
    searchQuery.value = '';
  }, [isFocused, searchQuery, searchViewProgress]);

  return (
    <>
      <Animated.View
        style={[
          backgroundStyle,
          styles.searchBackground,
          { backgroundColor: isDarkMode ? HOMEPAGE_BACKGROUND_COLOR_DARK : HOMEPAGE_BACKGROUND_COLOR_LIGHT },
        ]}
      >
        <SearchResults goToUrl={url => handleUrlSubmit({ shouldBlur: true, updatedUrl: url })} />
      </Animated.View>
      <GestureDetector gesture={tabViewGestureHandler}>
        <Animated.View style={[bottomBarStyle, styles.bottomBarStyle]}>
          <Animated.View style={[styles.barStyle, barStyle, expensiveBarStyles]}>
            <Animated.View style={[styles.cover, tapToExpandBottomBarStyle]}>
              <GestureDetector gesture={tapToExpandGesture}>
                <View style={styles.cover} />
              </GestureDetector>
            </Animated.View>
            <Animated.View style={[accountIconStyle, styles.accountIcon]}>
              <AccountIcon />
            </Animated.View>
            <View style={styles.searchInputContainer}>
              <SearchInput
                inputRef={inputRef}
                onBlurWorklet={onBlurWorklet}
                onPressWorklet={onAddressInputPressWorklet}
                onSubmitEditing={url => handleUrlSubmit({ shouldBlur: false, updatedUrl: url })}
              />
            </View>
            <TabButton inputRef={inputRef} toggleTabViewWorklet={toggleTabViewWorklet} />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
      <KeyboardHeightSetter />
    </>
  );
};

const KeyboardHeightSetter = () => {
  const { isFocused, keyboardHeight } = useSearchContext();

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
    paddingVertical: 20,
    paddingRight: 16,
    pointerEvents: 'box-none',
    width: '100%',
  },
  bottomBarStyle: {
    bottom: 0,
    height: BOTTOM_BAR_HEIGHT + TAB_BAR_HEIGHT,
    pointerEvents: 'box-none',
    position: 'absolute',
    width: DEVICE_WIDTH,
    zIndex: 10000,
  },
  cover: {
    bottom: 0,
    height: '100%',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
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
