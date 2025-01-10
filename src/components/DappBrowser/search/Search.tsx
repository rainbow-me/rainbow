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
import { GOOGLE_SEARCH_URL, HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT, HTTPS } from '../constants';
import { useTabSwitchGestures } from '../hooks/useTabSwitchGestures';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { isMissingValidProtocolWorklet, isValidURLWorklet } from '../utils';
import { useSearchContext } from './SearchContext';
import { SearchResults } from './results/SearchResults';
import { TabViewGestureStates } from '../types';

export const Search = () => {
  const {
    extraWebViewHeight,
    goToUrl,
    resetScrollHandlers,
    searchViewProgress,
    shouldCollapseBottomBar,
    tabViewGestureState,
    tabViewProgress,
    tabViewVisible,
  } = useBrowserContext();
  const { toggleTabViewWorklet } = useBrowserWorkletsContext();
  const { inputRef, isFocused, keyboardHeight, searchQuery, searchResults } = useSearchContext();
  const { isDarkMode } = useColorMode();

  const { tabSwitchGestureHandler } = useTabSwitchGestures();

  const barStyle = useAnimatedStyle(() => {
    const opacity = 1 - (_WORKLET ? tabViewProgress.value : 0) / 75;
    return { opacity };
  });

  const expensiveBarStyles = useAnimatedStyle(() => ({
    paddingLeft: withSpring(_WORKLET && isFocused.value ? 16 : 72, SPRING_CONFIGS.slowSpring),
    pointerEvents: _WORKLET && tabViewVisible?.value ? 'none' : 'auto',
  }));

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(_WORKLET && isFocused.value ? 0 : 1, SPRING_CONFIGS.slowSpring),
    pointerEvents: _WORKLET && isFocused.value ? 'none' : 'auto',
  }));

  const bottomBarStyle = useAnimatedStyle(() => {
    const translateY =
      _WORKLET && isFocused.value ? -(keyboardHeight.value - (IS_IOS ? TAB_BAR_HEIGHT : 46) + extraWebViewHeight.value) : 0;
    return {
      transform: [
        {
          translateY: withSpring(translateY, SPRING_CONFIGS.slowSpring),
        },
        {
          translateY: _WORKLET ? extraWebViewHeight.value : 0,
        },
      ],
    };
  });

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: _WORKLET ? searchViewProgress.value / 100 : 0,
    pointerEvents: _WORKLET && isFocused.value ? 'auto' : 'none',
    zIndex: _WORKLET && searchViewProgress.value ? 1 : -1,
  }));

  const tapToExpandBottomBarStyle = useAnimatedStyle(() => {
    const enabled = _WORKLET && shouldCollapseBottomBar.value && !tabViewVisible.value && !isFocused.value;
    return {
      pointerEvents: enabled ? 'auto' : 'none',
    };
  });

  const tapToExpandGesture = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(5)
        .onEnd(() => {
          const isSwitchingTabs = tabViewGestureState.value !== TabViewGestureStates.INACTIVE;
          if (shouldCollapseBottomBar.value && !isSwitchingTabs) {
            shouldCollapseBottomBar.value = false;
          }
          runOnJS(resetScrollHandlers)();
        })
        .shouldCancelWhenOutside(true),
    [resetScrollHandlers, shouldCollapseBottomBar, tabViewGestureState]
  );

  const handleUrlSubmit = useCallback(
    ({ shouldBlur, url }: { shouldBlur: boolean; url: string }) => {
      let newUrl = url;

      if (!shouldBlur && searchQuery.value && searchResults.value.length > 0 && searchResults.value[0].url) {
        newUrl = searchResults.value[0].url;
      }

      if (!isValidURLWorklet(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (isMissingValidProtocolWorklet(newUrl)) {
        newUrl = HTTPS + newUrl;
      }

      if (shouldBlur) inputRef.current?.blur();
      goToUrl(newUrl);
    },
    [goToUrl, inputRef, searchQuery, searchResults]
  );

  const onAddressInputPressWorklet = useCallback(() => {
    'worklet';
    isFocused.value = true;
    searchViewProgress.value = withSpring(100, SPRING_CONFIGS.snappierSpringConfig);
    dispatchCommand(inputRef, 'focus');
  }, [inputRef, isFocused, searchViewProgress]);

  const onBlurWorklet = useCallback(() => {
    'worklet';
    isFocused.value = false;
    searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
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
        <SearchResults goToUrl={url => handleUrlSubmit({ shouldBlur: true, url })} />
      </Animated.View>
      <GestureDetector gesture={tabSwitchGestureHandler}>
        <Animated.View style={[styles.bottomBarStyle, bottomBarStyle]}>
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
                onSubmitEditing={url => handleUrlSubmit({ shouldBlur: false, url })}
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

  const isFocusedState = useSharedValueState(isFocused, { initialValue: false });
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
    zIndex: 30000,
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
    zIndex: 20000,
  },
  searchInputContainer: {
    flex: 1,
    paddingRight: 12,
  },
});
