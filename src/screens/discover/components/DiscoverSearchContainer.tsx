import lang from 'i18n-js';
import React, { useCallback, useEffect, useRef } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Column, Row } from '@/components/layout';
import { Text } from '@/components/text';
import DiscoverSearchInput from '@/components/discover/DiscoverSearchInput';
import { useDiscoverScreenContext } from '@/screens/discover/DiscoverScreenContext';
import { deviceUtils } from '@/utils';
import { analytics } from '@/analytics';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import styled from '@/styled-thing';
import { SectionList, TextInput } from 'react-native';
import { ThemeContextProps } from '@/theme';

const CancelButton = styled(ButtonPressAnimation)({
  marginTop: 9,
});

const CancelText = styled(Text).attrs(({ theme: { colors } }: { theme: ThemeContextProps }) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: 'semibold',
}))({
  ...(ios ? {} : { marginTop: -5 }),
  marginLeft: -3,
  marginRight: 15,
});

const sendQueryAnalytics = (query: string) => {
  if (query.length > 1) {
    analytics.track('Search Query', {
      category: 'discover',
      length: query.length,
      query: query,
    });
  }
};

export default function ({ children }: { children: React.ReactNode }) {
  const searchInputRef = useRef<TextInput>(null);
  const sectionListRef = useRef<SectionList>(null);

  const {
    setIsSearchModeEnabled,
    isSearchModeEnabled,
    isFetchingEns,
    isSearching,
    setIsSearching,
    setIsFetchingEns,
    searchQuery,
    setSearchQuery,
  } = useDiscoverScreenContext();

  const delayedShowSearch = useDelayedValueWithLayoutAnimation(isSearching);

  const setIsInputFocused = useCallback(
    (value: boolean) => {
      setIsSearching(value);
      setIsSearchModeEnabled(value);
    },
    [setIsSearchModeEnabled, setIsSearching]
  );

  const scrollToTop = useCallback(() => {
    sectionListRef.current?.scrollToLocation({
      animated: true,
      itemIndex: 0,
      sectionIndex: 0,
      viewOffset: 0,
      viewPosition: 0,
    });
  }, []);

  const onTapSearch = useCallback(() => {
    if (isSearchModeEnabled) {
      scrollToTop();
      searchInputRef.current?.focus();
    } else {
      setIsInputFocused(true);
      analytics.track('Tapped Search', {
        category: 'discover',
      });
    }
  }, [isSearchModeEnabled, scrollToTop, setIsInputFocused]);

  const cancelSearch = useCallback(() => {
    searchInputRef.current?.blur();
    setIsInputFocused(false);
    sendQueryAnalytics(searchQuery);
  }, [searchInputRef, setIsInputFocused, searchQuery]);

  useEffect(() => {
    if (!isSearchModeEnabled) {
      setSearchQuery('');
      setIsSearching(false);
      setIsFetchingEns(false);
      searchInputRef.current?.blur();
      setIsInputFocused(false);
    } else if (!searchInputRef.current?.isFocused()) {
      searchInputRef.current?.focus();
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  const placeholderText = deviceUtils.isNarrowPhone
    ? lang.t('discover.search.search_ethereum_short')
    : lang.t('discover.search.search_ethereum');
  return (
    <>
      <Row>
        <Column flex={1} marginHorizontal={4}>
          <DiscoverSearchInput
            clearTextOnFocus={false}
            isDiscover
            isFetching={isFetchingEns}
            isSearching={isSearching}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={setSearchQuery}
            onFocus={onTapSearch}
            placeholderText={isSearchModeEnabled ? placeholderText : `􀊫 ${placeholderText}`}
            ref={searchInputRef}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        <CancelButton onPress={cancelSearch} testID="done-button">
          {delayedShowSearch && <CancelText>{lang.t('button.done')}</CancelText>}
        </CancelButton>
      </Row>
      {children}
    </>
  );
}
