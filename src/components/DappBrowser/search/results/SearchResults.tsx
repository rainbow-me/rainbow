import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import Animated, { SharedValue, useAnimatedReaction, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { Bleed, Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode, useForegroundColor } from '@/design-system';
import { Dapp, DappsContextProvider, useDappsContext } from '@/resources/metadata/dapps';
import { useBrowserContext } from '../../BrowserContext';
import { SEARCH_BAR_HEIGHT } from '../../search-input/SearchInput';
import { useSearchContext } from '../SearchContext';
import { GoogleSearchResult, SearchResult } from './SearchResult';
import deviceUtils, { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { isValidURLWorklet } from '../../utils';
import * as i18n from '@/languages';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';

const search = (query: string, dapps: Dapp[], numberOfResults = 4): Dapp[] => {
  'worklet';
  if (!query || !dapps || !dapps.length) return [];

  const normalizedQuery = query.toLowerCase();
  const queryTokens = new Set(normalizedQuery.split(' ').filter(Boolean));

  const filteredDapps = dapps
    .map(dapp => {
      let relevance = dapp.status === 'VERIFIED' ? 0.5 : 0;
      const name = dapp.search.normalizedName;
      const nameTokens = dapp.search.normalizedNameTokens;
      const urlTokens = dapp.search.normalizedUrlTokens;
      const url = dapp.urlDisplay;

      const dappTokenSet = new Set([...nameTokens, ...urlTokens]);

      if (name.startsWith(normalizedQuery)) {
        relevance = 4 + Math.min(1, query.length / name.length);
      } else if (nameTokens.some(token => token.startsWith(normalizedQuery))) {
        relevance = 3;
      } else if (urlTokens.some(token => token.startsWith(normalizedQuery))) {
        relevance = 2;
      } else if (Array.from(queryTokens).every(token => dappTokenSet.has(token))) {
        relevance = 1;
      } else if (
        (queryTokens.size === 1 && query.length >= 3 && url.startsWith(normalizedQuery)) ||
        (query.length >= 5 && url.includes(normalizedQuery))
      ) {
        relevance = 1;
      }

      return relevance > 0.5 ? { ...dapp, relevance } : null;
    })
    .filter(dapp => dapp !== null)
    .sort((a, b) => {
      // Prioritize trending
      if (b?.trending === true && a?.trending !== true) return 1;
      if (a?.trending === true && b?.trending !== true) return -1;

      // @ts-expect-error: Need to fix these types
      const relevanceDiff = b.relevance - a.relevance;
      if (relevanceDiff === 0) {
        // @ts-expect-error: Same here
        const aWordCount = a.name.split(' ').length;
        // @ts-expect-error: Same here
        const bWordCount = b.name.split(' ').length;
        return aWordCount - bWordCount;
      }
      return relevanceDiff;
    })
    .slice(0, numberOfResults);

  // if the query is a valid URL and is not already in the results, add it to the results
  if (isValidURLWorklet(query) && !filteredDapps.some(dapp => dapp?.urlDisplay.startsWith(query))) {
    const shouldTrimLastResult = filteredDapps.length === numberOfResults && DEVICE_HEIGHT <= deviceUtils.iPhone15ProHeight;
    const dappResults = shouldTrimLastResult ? filteredDapps.slice(0, numberOfResults - 1) : filteredDapps;
    return [{ url: query, urlDisplay: query, name: query, isDirect: true } as unknown as Dapp, ...(dappResults as Dapp[])];
  }

  // @ts-expect-error: Same here
  return filteredDapps;
};

export const SearchResults = React.memo(function SearchResults({
  goToUrl,
  isFocused,
}: {
  goToUrl: (url: string) => void;
  isFocused: SharedValue<boolean>;
}) {
  const { isDarkMode } = useColorMode();
  const { searchViewProgress } = useBrowserContext();
  const { inputRef, keyboardHeight, searchQuery, searchResults } = useSearchContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const animatedSearchContainerStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress.value,
    pointerEvents: isFocused.value ? 'auto' : 'none',
  }));

  const onPressX = useCallback(() => {
    inputRef?.current?.blur();
  }, [inputRef]);

  const allResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: searchQuery.value ? 'flex' : 'none',
  }));

  const moreResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'flex' : 'none',
  }));

  const suggestedGoogleSearchAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'none' : 'flex',
  }));

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress.value,
    transform: [{ scale: withSpring(isFocused.value ? 1 : 0.5, SPRING_CONFIGS.snappySpringConfig) }],
  }));

  const emptyStateAnimatedStyle = useAnimatedStyle(() => ({
    height: DEVICE_HEIGHT - keyboardHeight.value,
    opacity: searchQuery.value ? 0 : searchViewProgress.value * 0.6,
    transform: [
      { scale: withSpring(isFocused.value ? 1 : 0.8, SPRING_CONFIGS.snappySpringConfig) },
      { translateY: withSpring(isFocused.value ? 0 : 80, SPRING_CONFIGS.snappySpringConfig) },
    ],
  }));

  return (
    <>
      <DappsContextProvider>
        <DappsDataSync isFocused={isFocused} searchQuery={searchQuery} searchResults={searchResults} />
      </DappsContextProvider>
      <Animated.View
        style={[
          styles.searchContainer,
          isDarkMode ? styles.searchBackgroundDark : styles.searchBackgroundLight,
          animatedSearchContainerStyle,
        ]}
      >
        <Animated.View style={[styles.closeButton, closeButtonAnimatedStyle]}>
          <Box
            as={ButtonPressAnimation}
            background="fill"
            height={{ custom: 32 }}
            width={{ custom: 32 }}
            borderRadius={32}
            alignItems="center"
            justifyContent="center"
            onPress={onPressX}
            scaleTo={0.8}
          >
            <Text weight="heavy" color="labelSecondary" size="icon 15px" align="center">
              􀆄
            </Text>
          </Box>
        </Animated.View>
        <Animated.View style={[styles.emptyStateContainer, emptyStateAnimatedStyle]}>
          <Stack alignHorizontal="center" space="24px">
            <Text align="center" color="labelQuaternary" size="34pt" weight="heavy">
              􀊫
            </Text>
            <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
              {i18n.t(i18n.l.dapp_browser.search.find_apps_and_more)}
            </Text>
          </Stack>
        </Animated.View>
        <Animated.View style={allResultsAnimatedStyle}>
          <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: SEARCH_BAR_HEIGHT }}>
            <Inset>
              <Stack space="32px">
                <Box paddingTop={{ custom: 42 }}>
                  <SearchResult index={0} goToUrl={goToUrl} />
                  <Box
                    as={Animated.View}
                    borderRadius={18}
                    background="fill"
                    style={[
                      suggestedGoogleSearchAnimatedStyle,
                      {
                        borderWidth: THICK_BORDER_WIDTH,
                        borderColor: isDarkMode ? separatorSecondary : separatorTertiary,
                        borderCurve: 'continuous',
                        overflow: 'hidden',
                      },
                    ]}
                  >
                    <Bleed space={{ custom: THICK_BORDER_WIDTH }}>
                      <GoogleSearchResult goToUrl={goToUrl} />
                    </Bleed>
                  </Box>
                </Box>
                <Animated.View style={moreResultsAnimatedStyle}>
                  <Stack space="12px">
                    <Inset horizontal="8px">
                      <Inline space="6px" alignVertical="center">
                        <TextIcon color="labelSecondary" size="icon 15px" weight="heavy" width={20}>
                          􀊫
                        </TextIcon>
                        <Text color="label" size="20pt" weight="heavy">
                          {i18n.t(i18n.l.dapp_browser.search.more_results)}
                        </Text>
                      </Inline>
                    </Inset>
                    <Box gap={6}>
                      <GoogleSearchResult goToUrl={goToUrl} />
                      <SearchResult index={1} goToUrl={goToUrl} />
                      <SearchResult index={2} goToUrl={goToUrl} />
                      <SearchResult index={3} goToUrl={goToUrl} />
                      <SearchResult index={4} goToUrl={goToUrl} />
                      <SearchResult index={5} goToUrl={goToUrl} />
                    </Box>
                  </Stack>
                </Animated.View>
              </Stack>
            </Inset>
          </ScrollView>
        </Animated.View>
      </Animated.View>
    </>
  );
});

const DappsDataSync = ({
  isFocused,
  searchQuery,
  searchResults,
}: {
  isFocused: SharedValue<boolean>;
  searchQuery: SharedValue<string>;
  searchResults: SharedValue<Dapp[]>;
}) => {
  const { dapps } = useDappsContext();

  useAnimatedReaction(
    () => searchQuery.value,
    (result, previous) => {
      if (result !== previous && isFocused.value) {
        searchResults.modify(value => {
          const results = search(result, dapps, 4);
          value.splice(0, value.length);
          value.push(...results);
          return value;
        });
      }
    }
  );

  return null;
};

const styles = StyleSheet.create({
  closeButton: {
    height: 32,
    position: 'absolute',
    right: 16,
    top: 60,
    width: 32,
    zIndex: 1000,
  },
  emptyStateContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    marginTop: 36,
    pointerEvents: 'none',
    position: 'absolute',
    right: 0,
    top: 0,
  },
  searchContainer: {
    height: DEVICE_HEIGHT,
    paddingTop: 60,
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
  searchBackgroundDark: {
    backgroundColor: globalColors.grey100,
  },
  searchBackgroundLight: {
    backgroundColor: '#FBFCFD',
  },
});
