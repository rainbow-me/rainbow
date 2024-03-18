import { Box } from '@/design-system';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputSubmitEditingEventData } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedKeyboard, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import isValidDomain from 'is-valid-domain';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { RAINBOW_HOME, useBrowserContext } from './BrowserContext';
import { AccountIcon } from './address-bar/AccountIcon';
import { TabButton } from './address-bar/TabButton';
import { AddressInput } from './address-bar/AddressInput';
import useDimensions from '@/hooks/useDimensions';

const GOOGLE_SEARCH_URL = 'https://www.google.com/search?q=';
const HTTP = 'http://';
const HTTPS = 'https://';

const timingConfig = {
  duration: 500,
  easing: Easing.bezier(0.22, 1, 0.36, 1),
};

export const AddressBar = () => {
  const { tabStates, activeTabIndex, tabViewProgress, onRefresh, updateActiveTabState, toggleTabView } = useBrowserContext();

  const [url, setUrl] = useState<string>(tabStates[activeTabIndex].url);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const inputRef = useRef<TextInput>(null);
  const keyboard = useAnimatedKeyboard();
  const { width: deviceWidth } = useDimensions();

  const animationProgress = useSharedValue(0);

  const barStyle = useAnimatedStyle(() => ({
    opacity: 1 - (tabViewProgress?.value ?? 0),
    paddingLeft: withTiming(isFocused ? 16 : 72, timingConfig),
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
    opacity: withTiming(isFocused ? 0 : 1, timingConfig),
  }));

  useEffect(() => {
    if (isFocused) {
      animationProgress.value = withTiming(1, timingConfig);
    } else {
      animationProgress.value = withTiming(0, timingConfig);
    }
  }, [animationProgress, isFocused]);

  const bottomBarStyle = useAnimatedStyle(() => {
    return {
      height: TAB_BAR_HEIGHT + 88,
      transform: [{ translateY: Math.min(-(keyboard.height.value - 82), 0) }],
    };
  }, [tabViewProgress, keyboard.height]);

  const handleUrlSubmit = (event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    let newUrl = event.nativeEvent.text;

    let urlForValidation = newUrl.replace(/^https?:\/\//, '');
    if (urlForValidation.endsWith('/')) {
      urlForValidation = urlForValidation.slice(0, -1);
    }

    if (!isValidDomain(urlForValidation, { wildcard: true })) {
      newUrl = GOOGLE_SEARCH_URL + newUrl;
    } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
      newUrl = HTTPS + newUrl;
    }

    updateActiveTabState(activeTabIndex, { url: newUrl });
  };

  const formattedUrl = useMemo(() => {
    try {
      const { hostname, pathname, search } = new URL(url);
      if (hostname === 'www.google.com' && pathname === '/search') {
        const params = new URLSearchParams(search);
        return params.get('q') || url;
      }
      return hostname.startsWith('www.') ? hostname.slice(4) : hostname;
    } catch {
      return url;
    }
  }, [url]);

  // url handling needs work
  useEffect(() => {
    if (tabStates[activeTabIndex].url !== url) {
      setUrl(tabStates[activeTabIndex].url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabIndex, tabStates]);

  const onUrlChange = (newUrl: string) => {
    setUrl(newUrl);
  };

  const isGoogleSearch = url.startsWith(GOOGLE_SEARCH_URL);
  const isHome = formattedUrl === RAINBOW_HOME;
  // eslint-disable-next-line no-nested-ternary
  const inputValue = isHome ? undefined : isFocused && !isGoogleSearch ? url : formattedUrl;

  const shouldShowDetails = !isFocused && !isHome;

  const onAddressInputPress = useCallback(() => {
    if (!isFocused) {
      setIsFocused(true);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isFocused]);

  const onBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const onFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return (
    <Box
      as={Animated.View}
      bottom={{ custom: 0 }}
      paddingTop="20px"
      pointerEvents="box-none"
      position="absolute"
      style={[bottomBarStyle, { zIndex: 10000 }]}
      width={{ custom: deviceWidth }}
    >
      <Box
        as={Animated.View}
        paddingRight="16px"
        style={[{ alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }, barStyle]}
        width="full"
      >
        <Box as={Animated.View} position="absolute" style={[accountIconStyle, { left: 16, pointerEvents: isFocused ? 'none' : 'auto' }]}>
          <AccountIcon />
        </Box>

        <Box paddingRight="12px" style={{ flex: 1 }}>
          <AddressInput
            onPress={onAddressInputPress}
            isFocused={isFocused}
            inputRef={inputRef}
            inputValue={inputValue}
            onBlur={onBlur}
            onFocus={onFocus}
            onChangeText={onUrlChange}
            onSubmitEditing={handleUrlSubmit}
            tabViewProgress={tabViewProgress}
            shouldShowRefreshButton={!isHome && !!tabStates[activeTabIndex].url && !isFocused}
            shouldShowMenuButton={shouldShowDetails}
            onRefresh={onRefresh}
          />
        </Box>

        <TabButton toggleTabView={toggleTabView} isFocused={isFocused} inputRef={inputRef} />
      </Box>
    </Box>
  );
};
