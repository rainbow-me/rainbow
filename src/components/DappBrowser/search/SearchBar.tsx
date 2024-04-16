import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputChangeEventData, TextInputSubmitEditingEventData } from 'react-native';
import Animated, {
  AnimatedRef,
  SharedValue,
  dispatchCommand,
  interpolate,
  runOnJS,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
import { useKeyboardHeight, useDimensions } from '@/hooks';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
import { useBrowserContext } from '../BrowserContext';
import { GOOGLE_SEARCH_URL, HTTP, HTTPS, RAINBOW_HOME } from '../constants';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { formatUrl, isValidURL, normalizeUrl } from '../utils';
import { ButtonPressAnimation } from '@/components/animations';
import { GoogleSearchResult, SearchResult } from './SearchResult';
import { useDapps } from '@/resources/metadata/dapps';
import { GetdAppsQuery } from '@/graphql/__generated__/metadata';
import { filterList } from '@/utils';
import { rankings } from 'match-sorter';

export const SearchBar = ({ inputRef, searchQuery }: { inputRef: AnimatedRef<TextInput>; searchQuery: SharedValue<string> }) => {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();
  const { activeTabIndex, onRefresh, searchViewProgress, tabStates, tabViewProgress, tabViewVisible, updateActiveTabState } =
    useBrowserContext();
  const { dapps, dappsNameTrie, dappsUrlTrie } = useDapps();

  const isFocusedValue = useSharedValue(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);

  const keyboardHeight = useKeyboardHeight({ shouldListen: isFocused });

  const tabId = tabStates?.[activeTabIndex]?.uniqueId;
  const url = tabStates?.[activeTabIndex]?.url;
  const logoUrl = tabStates?.[activeTabIndex]?.logoUrl;
  const isHome = url === RAINBOW_HOME;
  const isGoogleSearch = url?.startsWith(GOOGLE_SEARCH_URL);
  const canGoBack = tabStates?.[activeTabIndex]?.canGoBack;
  const canGoForward = tabStates?.[activeTabIndex]?.canGoForward;

  const formattedInputValue = useMemo(() => {
    if (isHome) {
      return { url: i18n.t(i18n.l.dapp_browser.address_bar.input_placeholder), tabIndex: activeTabIndex };
    }
    return { url: formatUrl(url), tabIndex: activeTabIndex };
  }, [activeTabIndex, isHome, url]);

  const urlWithoutTrailingSlash = url?.endsWith('/') ? url.slice(0, -1) : url;
  // eslint-disable-next-line no-nested-ternary
  const inputValue = isHome ? undefined : isGoogleSearch ? formattedInputValue.url : urlWithoutTrailingSlash;

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
    // setBasicSearchResults([]);
    // setSearchQuery(inputValue ?? '');
    if (isFocused) {
      setIsFocused(false);
    }
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    }
    isFocusedValue.value = false;
  }, [isFocused, isFocusedValue, searchViewProgress]);

  const onChange = useCallback(
    (event: NativeSyntheticEvent<TextInputChangeEventData>) => {
      searchQuery.value = event.nativeEvent.text;
    },
    [searchQuery]
  );

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
        <Box as={Animated.View} position="absolute" style={[accountIconStyle, { left: 24 }]}>
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
            searchQuery={searchQuery}
            onChange={onChange}
          />
        </Box>
        <TabButton inputRef={inputRef} isFocused={isFocused} isFocusedValue={isFocusedValue} setIsFocused={setIsFocused} />
      </Box>
    </Box>
  );
};
