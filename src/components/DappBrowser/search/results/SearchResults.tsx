import React, { useCallback } from 'react';
import { ScrollView, TextInput } from 'react-native';
import Animated, { AnimatedRef, SharedValue, useAnimatedReaction, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { useBrowserContext } from '../../BrowserContext';
import { normalizeUrl } from '../../utils';
import { ButtonPressAnimation } from '@/components/animations';
import { GoogleSearchResult, SearchResult } from './SearchResult';
import { Dapp, useDapps } from '@/resources/metadata/dapps';
import { useKeyboardHeight } from '@/hooks';
import { SEARCH_BAR_HEIGHT } from '../bar/SearchBar';

const search = (query: string, dapps: Dapp[]) => {
  'worklet';
  if (!query || !dapps || !dapps.length) return [];

  const normalizedQuery = query.toLowerCase();

  const filteredDapps = dapps
    .map(dapp => {
      if (dapp.status === 'SCAM') {
        return { ...dapp, relevance: 0 };
      }

      let relevance = dapp.status === 'VERIFIED' ? 0.5 : 0;

      const queryTokens = normalizedQuery.split(' ').filter(Boolean);
      const name = dapp.search.normalizedName;
      const nameTokens = dapp.search.normalizedNameTokens;
      const urlTokens = dapp.search.normalizedUrlTokens;

      const checkSet = new Set([...nameTokens, ...urlTokens]);
      if (name.startsWith(normalizedQuery)) {
        relevance = 4;
      } else if (nameTokens.some((token, index) => index !== 0 && token.startsWith(normalizedQuery))) {
        relevance = 3;
      } else if (urlTokens.some(token => token.startsWith(normalizedQuery))) {
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

  return filteredDapps;
};

export const SearchResults = ({
  inputRef,
  searchQuery,
  isFocused,
}: {
  inputRef: AnimatedRef<TextInput>;
  searchQuery: SharedValue<string>;
  isFocused: boolean;
}) => {
  const { isDarkMode } = useColorMode();
  const { searchViewProgress, updateActiveTabState } = useBrowserContext();
  const { dapps } = useDapps();
  const keyboardHeight = useKeyboardHeight({ shouldListen: isFocused });

  const searchResults = useSharedValue<Dapp[]>([]);

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

  const onPressX = useCallback(() => {
    inputRef?.current?.blur();
  }, [inputRef]);

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

  const moreResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'flex' : 'none',
  }));

  const suggestedGoogleSearchAnimatedStyle = useAnimatedStyle(() => ({
    display: searchResults.value.length ? 'none' : 'flex',
  }));

  return (
    <Box
      as={Animated.View}
      height="full"
      width="full"
      position="absolute"
      style={[
        backgroundStyle,
        {
          backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD',
          paddingTop: 80,
          paddingBottom: keyboardHeight,
        },
      ]}
    >
      <Box
        as={ButtonPressAnimation}
        background="fill"
        height={{ custom: 32 }}
        width={{ custom: 32 }}
        borderRadius={32}
        alignItems="center"
        right={{ custom: 16 }}
        top={{ custom: 80 }}
        style={{ zIndex: 1000 }}
        justifyContent="center"
        position="absolute"
        onPress={onPressX}
      >
        <Text weight="heavy" color="labelSecondary" size="icon 15px" align="center">
          􀆄
        </Text>
      </Box>
      <Animated.View style={allResultsAnimatedStyle}>
        <ScrollView style={{ paddingHorizontal: 16 }} contentContainerStyle={{ paddingBottom: SEARCH_BAR_HEIGHT }}>
          <Inset>
            <Stack space="32px">
              <Box gap={12}>
                <Inset horizontal="8px" vertical={{ custom: 9 }}>
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
                <Box>
                  <SearchResult index={0} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  <Animated.View style={suggestedGoogleSearchAnimatedStyle}>
                    <GoogleSearchResult searchQuery={searchQuery} navigateToUrl={navigateToUrl} />
                  </Animated.View>
                </Box>
              </Box>
              <Animated.View style={moreResultsAnimatedStyle}>
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
                  <Box gap={4}>
                    <GoogleSearchResult searchQuery={searchQuery} navigateToUrl={navigateToUrl} />
                    <SearchResult index={1} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                    <SearchResult index={2} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                    <SearchResult index={3} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                    <SearchResult index={4} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                    <SearchResult index={5} searchResults={searchResults} navigateToUrl={navigateToUrl} />
                  </Box>
                </Stack>
              </Animated.View>
            </Stack>
          </Inset>
        </ScrollView>
      </Animated.View>
    </Box>
  );
};
