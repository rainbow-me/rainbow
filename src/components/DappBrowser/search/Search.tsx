import { ButtonPressAnimation } from '@/components/animations';
import { SPRING_CONFIGS } from '@/components/animations/animationConfigs';
import { Box, Inline, Inset, Stack, Text, TextIcon, globalColors, useColorMode } from '@/design-system';
import { IS_IOS } from '@/env';
// import { GetdAppsQuery } from '@/graphql/__generated__/metadata';
import { useKeyboardHeight } from '@/hooks';
import * as i18n from '@/languages';
import { TAB_BAR_HEIGHT } from '@/navigation/SwipeNavigator';
// import { useDapps } from '@/resources/metadata/dapps';
// import { filterList } from '@/utils';
// import { rankings } from 'match-sorter';
import React, { useCallback, useState } from 'react';
import { NativeSyntheticEvent, StyleSheet, TextInput, TextInputChangeEventData, TextInputSubmitEditingEventData, View } from 'react-native';
import Animated, {
  SharedValue,
  dispatchCommand,
  interpolate,
  runOnJS,
  runOnUI,
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useBrowserContext } from '../BrowserContext';
import { GOOGLE_SEARCH_URL, HTTP, HTTPS, RAINBOW_HOME } from '../constants';
import { AccountIcon } from '../search-input/AccountIcon';
import { SearchInput } from '../search-input/SearchInput';
import { TabButton } from '../search-input/TabButton';
import { isValidURLWorklet } from '../utils';
// import { GoogleSearchResult, SearchResult } from './SearchResult';
import { useBrowserStore } from '@/state/browser/browserStore';
import { DEVICE_WIDTH } from '@/utils/deviceUtils';
import { useBrowserWorkletsContext } from '../BrowserWorkletsContext';

export const Search = React.memo(function Search() {
  const { animatedActiveTabIndex, currentlyOpenTabIds, searchViewProgress, tabViewProgress, tabViewVisible } = useBrowserContext();
  const { toggleTabViewWorklet, updateTabUrlWorklet } = useBrowserWorkletsContext();

  const { isDarkMode } = useColorMode();

  const goToPage = useBrowserStore(state => state.goToPage);

  const isFocusedValue = useSharedValue(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  // const [basicSearchResults, setBasicSearchResults] = useState<GetdAppsQuery['dApps']>([]);
  // const [suggestedSearchResults, setSuggestedSearchResults] = useState<GetdAppsQuery['dApps']>([]);
  // const [searchQuery, setSearchQuery] = useState<string>('');

  const keyboardHeight = useKeyboardHeight({ shouldListen: isFocused });
  const inputRef = useAnimatedRef<TextInput>();

  const barStyle = useAnimatedStyle(() => {
    const opacity = 1 - tabViewProgress.value / 75;
    return {
      display: opacity <= 0 ? 'none' : 'flex',
      opacity,
      pointerEvents: tabViewVisible.value ? 'none' : 'auto',
      transform: [{ scale: interpolate(tabViewProgress.value, [0, 100], [1, 0.95]) }],
    };
  });

  const expensiveBarStyles = useAnimatedStyle(() => ({
    paddingLeft: withSpring(isFocusedValue.value ? 16 : 72, SPRING_CONFIGS.keyboardConfig),
    pointerEvents: tabViewVisible?.value ? 'none' : 'auto',
  }));

  // const displayNoneInTabView = useAnimatedStyle(() => ({
  //   display: (tabViewProgress?.value ?? 0) >= 50 ? 'none' : 'flex',
  // }));

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

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: searchViewProgress.value,
    pointerEvents: searchViewProgress.value ? 'auto' : 'none',
    zIndex: searchViewProgress.value ? 1 : -1,
  }));

  const handleUrlSubmit = useCallback(
    (currentUrl: string | undefined, updatedUrl: string) => {
      'worklet';
      let newUrl = updatedUrl;

      if (!isValidURLWorklet(newUrl)) {
        newUrl = GOOGLE_SEARCH_URL + newUrl;
      } else if (!newUrl.startsWith(HTTP) && !newUrl.startsWith(HTTPS)) {
        newUrl = HTTPS + newUrl;
      }
      const tabId = currentlyOpenTabIds.value[Math.abs(animatedActiveTabIndex.value)];

      runOnJS(goToPage)(newUrl);
      updateTabUrlWorklet(newUrl, tabId);
    },
    [animatedActiveTabIndex, currentlyOpenTabIds, goToPage, updateTabUrlWorklet]
  );

  const onAddressInputPressWorklet = useCallback(() => {
    'worklet';
    isFocusedValue.value = true;
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(1, SPRING_CONFIGS.snappierSpringConfig);
    }
    runOnJS(setIsFocused)(true);
    dispatchCommand(inputRef, 'focus');
  }, [inputRef, isFocusedValue, searchViewProgress]);

  const onBlur = useCallback(() => {
    'worklet';
    // setBasicSearchResults([]);
    // setSearchQuery(inputValue ?? '');
    runOnJS(setIsFocused)(false);
    if (searchViewProgress !== undefined) {
      searchViewProgress.value = withSpring(0, SPRING_CONFIGS.snappierSpringConfig);
    }
    isFocusedValue.value = false;
  }, [isFocusedValue, searchViewProgress]);

  return (
    <>
      <Animated.View style={[backgroundStyle, styles.searchBackground, { backgroundColor: isDarkMode ? globalColors.grey100 : '#FBFCFD' }]}>
        {/* <Inset horizontal="16px" top={{ custom: 80 }}>
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
          <Inset top={{ custom: 9 }}>
            <Stack space="32px">
              {searchQuery.length && suggestedSearchResults?.length && (
                <Stack space="12px">
                  <Inset horizontal="8px" bottom={{ custom: 9 }}>
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
                  <Stack space="4px">
                    {suggestedSearchResults.map(dapp => (
                      <SearchResult
                        suggested
                        iconUrl={dapp!.iconURL}
                        key={dapp!.url}
                        name={dapp!.name}
                        onPress={onPressSearchResult}
                        url={dapp!.url}
                      />
                    ))}
                  </Stack>
                </Stack>
              )}
              {searchQuery.length && basicSearchResults?.length && (
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
                    <GoogleSearchResult query={searchQuery} onPress={onPressSearchResult} />
                    {basicSearchResults.map(dapp => (
                      <SearchResult
                        iconUrl={dapp!.iconURL}
                        key={dapp!.url}
                        name={dapp!.name}
                        onPress={onPressSearchResult}
                        url={dapp!.url}
                      />
                    ))}
                  </Stack>
                </Stack>
              )}
            </Stack>
          </Inset>
        </Inset> */}
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
              isFocused={isFocused}
              isFocusedValue={isFocusedValue}
              isGoogleSearch={false}
              inputRef={inputRef}
              isHome={false}
              onBlur={onBlur}
              onSubmitEditing={handleUrlSubmit}
            />
          </View>
          <TabButton
            inputRef={inputRef}
            isFocused={isFocused}
            isFocusedValue={isFocusedValue}
            setIsFocused={setIsFocused}
            toggleTabViewWorklet={toggleTabViewWorklet}
          />
        </Animated.View>
      </Animated.View>
    </>
  );
});

const styles = StyleSheet.create({
  accountIcon: { left: 24, position: 'absolute' },
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
