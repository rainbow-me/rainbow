import React, { useCallback, useMemo, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import Animated, {
  dispatchCommand,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight, useDimensions } from '@/hooks';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { RAINBOW_HOME, useBrowserContext } from '../BrowserContext';
import { GOOGLE_SEARCH_URL, HTTP, HTTPS } from '../constants';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { isValidURL } from '../utils';

export const SearchBar = () => {
  const { width: deviceWidth } = useDimensions();
  const { activeTabIndex, onRefresh, searchViewProgress, tabStates, tabViewProgress, tabViewVisible, updateActiveTabState } =
    useBrowserContext();

  const isFocusedValue = useSharedValue(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const keyboardHeight = useKeyboardHeight({ shouldListen: isFocused });
  const inputRef = useAnimatedRef<TextInput>();

  const tabId = tabStates?.[activeTabIndex]?.uniqueId;
  const url = tabStates?.[activeTabIndex]?.url;
  const logoUrl = tabStates?.[activeTabIndex]?.logoUrl;
  const isHome = url === RAINBOW_HOME;
  const isGoogleSearch = url?.startsWith(GOOGLE_SEARCH_URL);
  const canGoBack = tabStates?.[activeTabIndex]?.canGoBack;
  const canGoForward = tabStates?.[activeTabIndex]?.canGoForward;

  const formattedInputValue = useMemo(() => {
    if (isHome) {
      return { value: i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder), tabIndex: activeTabIndex };
    }

    let formattedValue = '';
    try {
      const { hostname, pathname, search } = new URL(url);
      if (hostname === 'www.google.com' && pathname === '/search') {
        const params = new URLSearchParams(search);
        formattedValue = params.get('q') || '';
      } else {
        formattedValue = hostname.startsWith('www.') ? hostname.slice(4) : hostname;
      }
    } catch {
      if (!isGoogleSearch) {
        formattedValue = url;
      }
    }
    return { value: formattedValue, tabIndex: activeTabIndex };
  }, [activeTabIndex, isGoogleSearch, isHome, url]);

  const urlWithoutTrailingSlash = url?.endsWith('/') ? url.slice(0, -1) : url;
  // eslint-disable-next-line no-nested-ternary
  const inputValue = isHome ? undefined : isGoogleSearch ? formattedInputValue.value : urlWithoutTrailingSlash;

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

  const accountIconStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isFocusedValue.value ? 0 : 1, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: isFocusedValue.value ? 'none' : 'auto',
  }));

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

  const handleUrlSubmit = useCallback(
    (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
      inputRef.current?.blur();

      let newUrl = event.nativeEvent.text;

      if (!isValidURL(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }

      if (newUrl !== url) {
        updateActiveTabState({ url: newUrl }, tabId);
      } else {
        onRefresh();
      }
    },
    [inputRef, onRefresh, tabId, updateActiveTabState, url]
  );

  const onAddressInputPressWorklet = () => {
    'worklet';
    isFocusedValue.value = true;
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(1, SPRING_CONFIGS.snappierSpringConfig);
    }
    runOnJS(setIsFocused)(true);
    dispatchCommand(inputRef, 'focus');
  };

  const onBlur = useCallback(() => {
    if (isFocused) {
      setIsFocused(false);
    }
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    }
    isFocusedValue.value = false;
  }, [isFocused, isFocusedValue, searchViewProgress]);

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[bottomBarStyle, { height: TAB_BAR_HEIGHT + 88, zIndex: 10000 }]}
      width={{ custom: deviceWidth }}
    >
      <Box
        as={Animated.View}
        paddingRight="16px"
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, barStyle]}
        width="full"
      >
        <Box as={Animated.View} position="absolute" style={[accountIconStyle, { left: 16 }]}>
          <AccountIcon />
        </Box>

        <Box paddingRight="12px" style={{ flex: 1 }}>
          <SearchInput
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onPressWorklet={onAddressInputPressWorklet}
            isFocused={isFocused}
            isFocusedValue={isFocusedValue}
            isGoogleSearch={isGoogleSearch}
            inputRef={inputRef}
            isHome={isHome}
            formattedInputValue={formattedInputValue}
            inputValue={inputValue}
            onBlur={onBlur}
            onSubmitEditing={handleUrlSubmit}
            logoUrl={logoUrl}
          />
        </Box>
        <TabButton inputRef={inputRef} isFocused={isFocused} isFocusedValue={isFocusedValue} setIsFocused={setIsFocused} />
      </Box>
    </Box>
  );
};
