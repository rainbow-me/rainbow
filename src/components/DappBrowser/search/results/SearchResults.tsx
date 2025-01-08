import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { EasingGradient } from '@/components/easing-gradient/EasingGradient';
import { Bleed, Box, Inline, Inset, Stack, Text, TextIcon, useColorMode, useForegroundColor } from '@/design-system';
import * as i18n from '@/languages';
import { Dapp, useBrowserDappsStore } from '@/resources/metadata/dapps';
import { THICK_BORDER_WIDTH } from '@/__swaps__/screens/Swap/constants';
import deviceUtils, { DEVICE_HEIGHT, DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserContext } from '../../BrowserContext';
import { SEARCH_BAR_HEIGHT } from '../../Dimensions';
import { HOMEPAGE_BACKGROUND_COLOR_DARK, HOMEPAGE_BACKGROUND_COLOR_LIGHT } from '../../constants';
import { isValidURLWorklet } from '../../utils';
import { useSearchContext } from '../SearchContext';
import { GoogleSearchResult, SearchResult } from './SearchResult';

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

      const relevanceDiff = b.relevance - a.relevance;
      if (relevanceDiff === 0) {
        const aWordCount = a.name.split(' ').length;
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

  return filteredDapps;
};

export const SearchResults = React.memo(function SearchResults({ goToUrl }: { goToUrl: (url: string) => void }) {
  const { isDarkMode } = useColorMode();
  const { searchViewProgress } = useBrowserContext();
  const { inputRef, isFocused, keyboardHeight, searchQuery, searchResults } = useSearchContext();

  const separatorSecondary = useForegroundColor('separatorSecondary');
  const separatorTertiary = useForegroundColor('separatorTertiary');

  const backgroundStyle = isDarkMode ? styles.searchBackgroundDark : styles.searchBackgroundLight;

  const animatedSearchContainerStyle = useAnimatedStyle(() => ({
    opacity: _WORKLET ? searchViewProgress.value / 100 : 0,
    pointerEvents: _WORKLET && isFocused.value ? 'auto' : 'none',
  }));

  const allResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: _WORKLET && searchQuery.value.trim() ? 'flex' : 'none',
  }));

  const moreResultsAnimatedStyle = useAnimatedStyle(() => ({
    display: _WORKLET && searchResults.value.length ? 'flex' : 'none',
  }));

  const suggestedGoogleSearchAnimatedStyle = useAnimatedStyle(() => ({
    display: _WORKLET && (searchResults.value.length || !searchQuery.value.trim()) ? 'none' : 'flex',
  }));

  const closeButtonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: _WORKLET ? searchViewProgress.value / 100 : 0,
    transform: [{ scale: withSpring(_WORKLET && isFocused.value ? 1 : 0.5, SPRING_CONFIGS.snappySpringConfig) }],
  }));

  const emptyStateAnimatedStyle = useAnimatedStyle(() => {
    const searchQueryExists = _WORKLET && searchQuery.value.trim();
    return {
      height: DEVICE_HEIGHT - (_WORKLET ? keyboardHeight.value : 0),
      opacity: searchQueryExists || !_WORKLET ? 0 : (searchViewProgress.value / 100) * 0.6,
      pointerEvents: searchQueryExists ? 'none' : 'auto',
      transform: [
        { scale: withSpring(_WORKLET && isFocused.value ? 1 : 0.8, SPRING_CONFIGS.snappySpringConfig) },
        { translateY: withSpring(_WORKLET && isFocused.value ? 0 : 80, SPRING_CONFIGS.snappySpringConfig) },
      ],
    };
  });

  const onPressX = useCallback(() => {
    inputRef?.current?.blur();
  }, [inputRef]);

  const scrollHandler = useAnimatedScrollHandler({
    onEndDrag: event => {
      const velocityY = event.velocity?.y || 0;
      const isSwitchingTabsDown = velocityY <= 0;

      if (event.contentOffset.y < 0 && isSwitchingTabsDown) {
        searchViewProgress.value = withSpring(0, SPRING_CONFIGS.slowSpring, isFinished => {
          if (isFinished) {
            searchQuery.value = '';
          }
        });
        isFocused.value = false;
      }
    },
  });

  const swipeToCloseGesture = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.DOWN)
      .onStart(() => {
        runOnJS(onPressX)();
      }),
    Gesture.Tap().onEnd(() => {
      runOnJS(onPressX)();
    })
  );

  return (
    <>
      <Animated.View style={[styles.searchContainer, backgroundStyle, animatedSearchContainerStyle]}>
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
          <GestureDetector gesture={swipeToCloseGesture}>
            <Animated.View style={styles.cover}>
              <Stack alignHorizontal="center" space="24px">
                <Text align="center" color="labelQuaternary" size="34pt" weight="heavy">
                  􀊫
                </Text>
                <Text align="center" color="labelQuaternary" size="17pt" weight="heavy">
                  {i18n.t(i18n.l.dapp_browser.search.find_apps_and_more)}
                </Text>
              </Stack>
            </Animated.View>
          </GestureDetector>
        </Animated.View>
        <Animated.View style={allResultsAnimatedStyle}>
          <Animated.ScrollView
            contentContainerStyle={{ paddingBottom: SEARCH_BAR_HEIGHT }}
            keyboardShouldPersistTaps="always"
            onScroll={scrollHandler}
            showsVerticalScrollIndicator={false}
            style={styles.searchScrollView}
          >
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
          </Animated.ScrollView>
          <EasingGradient
            easing={Easing.inOut(Easing.quad)}
            endColor={backgroundStyle.backgroundColor}
            endOpacity={0}
            startColor={backgroundStyle.backgroundColor}
            startOpacity={1}
            steps={12}
            style={styles.topFade}
          />
          <EasingGradient
            easing={Easing.inOut(Easing.quad)}
            endColor={backgroundStyle.backgroundColor}
            startColor={backgroundStyle.backgroundColor}
            steps={12}
            style={styles.bottomFade}
          />
        </Animated.View>
      </Animated.View>

      <DappsDataSync isFocused={isFocused} searchQuery={searchQuery} searchResults={searchResults} />
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
  const dapps = useBrowserDappsStore(state => state.dapps);

  useAnimatedReaction(
    () => searchQuery.value.trim(),
    (query, previousQuery) => {
      if (!query && searchResults.value.length) {
        searchResults.modify(value => {
          value.splice(0, value.length);
          return value;
        });
        return;
      }
      if (query !== previousQuery && isFocused.value) {
        searchResults.modify(value => {
          const results = search(query, dapps, 4);
          value.splice(0, value.length);
          value.push(...results);
          return value;
        });
      }
    },
    [dapps]
  );

  return null;
};

const styles = StyleSheet.create({
  bottomFade: {
    bottom: 0,
    height: 42,
    pointerEvents: 'none',
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
  closeButton: {
    height: 32,
    position: 'absolute',
    right: 16,
    top: 60,
    width: 32,
    zIndex: 1000,
  },
  cover: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  emptyStateContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    marginTop: 36,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  searchBackgroundDark: {
    backgroundColor: HOMEPAGE_BACKGROUND_COLOR_DARK,
  },
  searchBackgroundLight: {
    backgroundColor: HOMEPAGE_BACKGROUND_COLOR_LIGHT,
  },
  searchContainer: {
    height: DEVICE_HEIGHT,
    paddingTop: 60,
    position: 'absolute',
    width: DEVICE_WIDTH,
  },
  searchScrollView: {
    paddingHorizontal: 16,
  },
  topFade: {
    height: 42,
    pointerEvents: 'none',
    position: 'absolute',
    top: 0,
    width: DEVICE_WIDTH,
  },
});
