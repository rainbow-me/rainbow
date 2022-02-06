import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ButtonPressAnimation } from '../animations';
import { ExchangeSearch } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';
import styled from '@rainbow-me/styled-components';

const CancelButton = styled(ButtonPressAnimation)({
  marginTop: 27,
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

export default forwardRef(function DiscoverSearchContainer(
  { children, showSearch, setShowSearch },
  ref
) {
  const searchInputRef = useRef();
  const sectionListRef = useRef();
  useImperativeHandle(ref, () => searchInputRef.current);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(showSearch);

  const upperContext = useContext(DiscoverSheetContext);
  const {
    setIsSearchModeEnabled,
    isSearchModeEnabled,
    jumpToLong,
    onFabSearch,
  } = upperContext;
  const {
    params: { setSwipeEnabled: setViewPagerSwipeEnabled },
  } = useRoute();

  const setIsInputFocused = useCallback(
    value => {
      setShowSearch(value);
      setTimeout(() => jumpToLong(), 10);
      setIsSearchModeEnabled(value);
      setViewPagerSwipeEnabled(!value);
    },
    [
      setIsSearchModeEnabled,
      setShowSearch,
      setViewPagerSwipeEnabled,
      jumpToLong,
    ]
  );

  const onTapSearch = useCallback(() => {
    if (isSearchModeEnabled) {
      sectionListRef.current?.scrollToLocation({
        animated: true,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 0,
        viewPosition: 0,
      });
      searchInputRef.current.focus();
    } else {
      setIsInputFocused(true);
      analytics.track('Tapped Search', {
        category: 'discover',
      });
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  onFabSearch.current = onTapSearch;

  const cancelSearch = useCallback(() => {
    searchInputRef.current?.blur();
    setIsInputFocused(false);
    sendQueryAnalytics(searchQuery);
  }, [searchInputRef, setIsInputFocused, searchQuery]);

  const contextValue = useMemo(
    () => ({
      ...upperContext,
      cancelSearch,
      isFetchingEns,
      isSearching,
      searchInputRef,
      searchQuery,
      sectionListRef,
      setIsFetchingEns,
      setIsSearching,
    }),
    [upperContext, isFetchingEns, isSearching, searchQuery, cancelSearch]
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

  return (
    <>
      <Row>
        <Column flex={1} marginTop={19}>
          <ExchangeSearch
            clearTextOnFocus={false}
            isDiscover
            isFetching={isFetchingEns}
            isSearching={isSearching}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={setSearchQuery}
            onFocus={onTapSearch}
            placeholderText={
              isSearchModeEnabled
                ? lang.t('discover.search.search_ethereum')
                : `􀊫 ${lang.t('discover.search.search_ethereum')}`
            }
            ref={searchInputRef}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        <CancelButton onPress={cancelSearch} testID="done-button">
          {delayedShowSearch && (
            <CancelText>{lang.t('button.done')}</CancelText>
          )}
        </CancelButton>
      </Row>
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
});
