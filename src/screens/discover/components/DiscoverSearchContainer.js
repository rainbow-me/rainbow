import { useRoute } from '@react-navigation/native';
import lang from 'i18n-js';
import React, { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ButtonPressAnimation } from '@/components/animations';
import { Column, Row } from '@/components/layout';
import { Text } from '@/components/text';
import DiscoverSearchInput from '@/components/discover/DiscoverSearchInput';
import DiscoverSheetContext from '../DiscoverScreenContext';
import { deviceUtils } from '@/utils';
import { analytics } from '@/analytics';
import { useDelayedValueWithLayoutAnimation } from '@/hooks';
import styled from '@/styled-thing';

const CancelButton = styled(ButtonPressAnimation)({
  marginTop: 9,
});

const CancelText = styled(Text).attrs(({ theme: { colors } }) => ({
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

const sendQueryAnalytics = query => {
  if (query.length > 1) {
    analytics.track('Search Query', {
      category: 'discover',
      length: query.length,
      query: query,
    });
  }
};

export let discoverOpenSearchFnRef = null;

export default forwardRef(function DiscoverSearchContainer({ children, showSearch, setShowSearch }, ref) {
  const searchInputRef = useRef();
  const sectionListRef = useRef();
  useImperativeHandle(ref, () => searchInputRef.current);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(showSearch);

  const { setIsSearchModeEnabled, isSearchModeEnabled } = useContext(DiscoverSheetContext);

  const setIsInputFocused = useCallback(
    value => {
      setShowSearch(value);
      setIsSearchModeEnabled(value);
    },
    [setIsSearchModeEnabled, setShowSearch]
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
      searchInputRef.current.focus();
    } else {
      setIsInputFocused(true);
      analytics.track('Tapped Search', {
        category: 'discover',
      });
    }
  }, [isSearchModeEnabled, scrollToTop, setIsInputFocused]);

  useEffect(() => {
    discoverOpenSearchFnRef = onTapSearch;
  }, [onTapSearch]);

  const cancelSearch = useCallback(() => {
    searchInputRef.current?.blur();
    setIsInputFocused(false);
    sendQueryAnalytics(searchQuery);
  }, [searchInputRef, setIsInputFocused, searchQuery]);

  const contextValue = useMemo(
    () => ({
      isSearchModeEnabled,
      setIsSearchModeEnabled,
      cancelSearch,
      isFetchingEns,
      isSearching,
      searchInputRef,
      searchQuery,
      sectionListRef,
      setIsFetchingEns,
      setIsSearching,
    }),
    [isSearchModeEnabled, setIsSearchModeEnabled, cancelSearch, isFetchingEns, isSearching, searchQuery]
  );

  useEffect(() => {
    if (!isSearchModeEnabled) {
      setSearchQuery('');
      setIsSearching(false);
      setIsFetchingEns(false);
      searchInputRef.current?.blur();
      setIsInputFocused(false);
    } else if (!searchInputRef.current.isFocused()) {
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
      <DiscoverSheetContext.Provider value={contextValue}>{children}</DiscoverSheetContext.Provider>
    </>
  );
});
