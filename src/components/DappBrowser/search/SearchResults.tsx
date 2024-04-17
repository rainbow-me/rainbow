import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { NativeSyntheticEvent, TextInput, TextInputChangeEventData, TextInputSubmitEditingEventData, View } from 'react-native';
import Animated, {
  AnimatedRef,
  SharedValue,
  dispatchCommand,
  interpolate,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { AnimatedText, Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
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
import { DAppStatus, GetdAppsQuery } from '@/graphql/__generated__/metadata';
import { filterList } from '@/utils';
import { rankings } from 'match-sorter';

const search = (query: string, dapps: any) => {
  'worklet';
  if (!query || !dapps || !dapps.length) return [];

  const normalizedQuery = query.toLowerCase();
  // if (!query || query === inputValue) {
  //   setSuggestedSearchResults([]);
  //   setBasicSearchResults([]);
  //   return;
  // }
  const filteredDapps = dapps
    .map(dapp => {
      if (dapp.status === 'SCAM') {
        return { ...dapp, relevance: 0 };
      }

      let relevance = dapp.status === 'VERIFIED' ? 0.5 : 0;
      const queryTokens = normalizedQuery.split(' ').filter(Boolean);
      const normalizedDappName = dapp!.name.toLowerCase();
      const dappNameTokens = normalizedDappName.split(' ').filter(Boolean);
      const dappUrlTokens = dapp!.url
        .toLowerCase()
        .replace(/(^\w+:|^)\/\//, '')
        .split(/\/|\?|&|=|\./)
        .filter(Boolean);

      const checkSet = new Set([...dappNameTokens, ...dappUrlTokens]);
      if (normalizedDappName.startsWith(normalizedQuery)) {
        relevance = 4;
      } else if (dappNameTokens.some((token, index) => index !== 0 && token.startsWith(normalizedQuery))) {
        relevance = 3;
      } else if (dappUrlTokens.some(token => token.startsWith(normalizedQuery))) {
        relevance = 2;
      } else if (
        queryTokens.every(token => {
          for (const item of checkSet) {
            if (item.includes(token)) {
              checkSet.delete(item);
              return true;
            }
          }
          return false;
        })
      ) {
        relevance = 1;
      }

      return { ...dapp, relevance };
    })
    .filter(dapp => dapp.relevance > 0.5)
    .sort((a, b) => b.relevance - a.relevance);
  console.log(filteredDapps.length);
  console.log('HI');
  return filteredDapps ?? [];
  // const filteredDapps = filterList(dappsWithTokens, query, ['tokens'], {
  //   threshold: rankings.STARTS_WITH,
  // }).sort((a, b) => +(b?.status === 'VERIFIED') - +(a?.status === 'VERIFIED'));
  // const nameSearch = dappsNameTrie.search(query).sort((a, b) => +(b?.status === 'VERIFIED') - +(a?.status === 'VERIFIED'));
  // const urlSearch = dappsUrlTrie.search(query).sort((a, b) => +(b?.status === 'VERIFIED') - +(a?.status === 'VERIFIED'));
  // const filteredDapps = [...nameSearch, ...urlSearch];
  // setBasicSearchResults(filteredDapps.slice(1, 3));
  // setSuggestedSearchResults(filteredDapps.slice(0, 1));
};

// export const AnimatedText = Animated.createAnimatedComponent(Text);
// export const AnimatedSearchResult = Animated.createAnimatedComponent(SearchResult);

export const SearchResults = ({ inputRef, searchQuery }: { inputRef: AnimatedRef<TextInput>; searchQuery: SharedValue<string> }) => {
  const { width: deviceWidth } = useDimensions();
  const { isDarkMode } = useColorMode();
  const { activeTabIndex, onRefresh, searchViewProgress, tabStates, tabViewProgress, tabViewVisible, updateActiveTabState } =
    useBrowserContext();
  const { dapps, dappsNameTrie, dappsUrlTrie } = useDapps();

  const isFocusedValue = useSharedValue(false);
  const testValue = useSharedValue('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [basicSearchResults, setBasicSearchResults] = useState<GetdAppsQuery['dApps']>([]);
  const [suggestedSearchResults, setSuggestedSearchResults] = useState<GetdAppsQuery['dApps']>([]);
  const searchResults = useSharedValue([]);

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

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress?.value || 0,
    pointerEvents: searchViewProgress?.value ? 'auto' : 'none',
  }));

  const navigateToUrl = useCallback(
    (url: string) => {
      updateActiveTabState({ url: normalizeUrl(url) });
      inputRef.current?.blur();
    },
    [inputRef, updateActiveTabState]
  );

  useAnimatedReaction(
    () => searchQuery.value,
    (result, previous) => {
      if (result !== previous) {
        searchResults.modify(value => {
          const results = search(result, dapps).slice(0, 6);
          value.splice(0, value.length);
          value.push(...results);
          return value;
        });
      }
    }
  );

  const allResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: searchQuery.value ? 'flex' : 'none',
  }));

  const suggestedGoogleSearchAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'none' : 'flex',
  }));

  const otherGoogleSearchAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'flex' : 'none',
  }));

  return (
    <Box
      as={Animated.View}
      height="full"
      width="full"
      position="absolute"
      style={[backgroundStyle, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }]}
    >
      <Inset horizontal="16px" top={{ custom: 80 }}>
        <Box
          as={ButtonPressAnimation}
          background="fill"
          height={{ custom: 32 }}
          width={{ custom: 32 }}
          borderRadius={32}
          alignItems="center"
          right={{ custom: 0 }}
          top={{ custom: 0 }}
          style={{ zIndex: 1000 }}
          justifyContent="center"
          position="absolute"
          onPress={() => inputRef?.current?.blur()}
        >
          <Text weight="heavy" color="labelSecondary" size="icon 15px" align="center">
            􀆄
          </Text>
        </Box>
        <Animated.View style={allResultsAnimatedStyle}>
          <Inset>
            <Stack space="32px">
              {/* {searchQuery.length && suggestedSearchResults?.length && ( */}
              <Stack space="12px">
                <Inset horizontal="8px" vertical="9px">
                  <Inline alignHorizontal="justify" alignVertical="center">
                    <Inline space="6px" alignVertical="center">
                      <TextIcon color="blue" size="icon 15px" weight="heavy" width={20}>
                        􀐫
                      </TextIcon>
                      <Text weight="heavy" color="label" size="20pt">
                        Suggested
                      </Text>
                    </Inline>
                  </Inline>
                </Inset>
                <SearchResult index={0} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                {/* <Animated.View style={suggestedGoogleSearchAnimatedStyle}>
                  <GoogleSearchResult searchQuery={searchQuery} navigateToUrl={navigateToUrl} />
                </Animated.View> */}
              </Stack>
              <Stack space="12px">
                <Inset horizontal="8px">
                  <Inline space="6px" alignVertical="center">
                    <TextIcon color="labelSecondary" size="icon 15px" weight="heavy" width={20}>
                      􀊫
                    </TextIcon>
                    <Text weight="heavy" color="label" size="20pt">
                      More Results
                    </Text>
                  </Inline>
                </Inset>
                <Stack space="4px">
                  <GoogleSearchResult searchQuery={searchQuery} navigateToUrl={navigateToUrl} />
                  <SearchResult index={1} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  <SearchResult index={2} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  <SearchResult index={3} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  <SearchResult index={4} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  <SearchResult index={5} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  {/* <AnimatedText color="label" weight="heavy" size="30pt">
                  {derivedValue}
                </AnimatedText> */}

                  {/* <GoogleSearchResult query={searchQuery} onPress={onPressSearchResult} /> */}
                  {/* {searchResults.value?.map(dapp => (
                  // <SearchResult iconUrl={dapp!.iconURL} key={dapp!.url} name={dapp!.name} onPress={onPressSearchResult} url={dapp!.url} />
                  <AnimatedText key={dapp!.url} color="label" weight="heavy" size="30pt">
                    {derivedValue}
                  </AnimatedText>
                ))} */}
                </Stack>
              </Stack>
              {/* )} */}
            </Stack>
          </Inset>
        </Animated.View>
      </Inset>
    </Box>
  );
};
