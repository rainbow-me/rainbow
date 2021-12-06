import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
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
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { ExchangeSearch } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
import DiscoverSheetContext from './DiscoverSheetContext';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useDelayedValueWithLayoutAnimation } from '@rainbow-me/hooks';

const CancelButton = styled(ButtonPressAnimation)`
  margin-top: 27;
`;

const CancelText = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: 'semibold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  ${ios ? '' : 'margin-top: -5;'}
  margin-left: -3;
  margin-right: 15;
`;

const sendQueryAnalytics = (query: any) => {
  if (query.length > 1) {
    analytics.track('Search Query', {
      category: 'discover',
      length: query.length,
      query: query,
    });
  }
};

export default forwardRef(function DiscoverSearchContainer(
  // @ts-expect-error ts-migrate(2339) FIXME: Property 'showSearch' does not exist on type '{ ch... Remove this comment to see the full error message
  { children, showSearch, setShowSearch },
  ref
) {
  const searchInputRef = useRef();
  const sectionListRef = useRef();
  useImperativeHandle(ref, () => searchInputRef.current);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingEns, setIsFetchingEns] = useState(false);
  const loadingAllTokens = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'uniswap' does not exist on type 'Default... Remove this comment to see the full error message
    ({ uniswap: { loadingAllTokens } }) => loadingAllTokens
  );
  const delayedShowSearch = useDelayedValueWithLayoutAnimation(showSearch);

  const upperContext = useContext(DiscoverSheetContext);
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'setIsSearchModeEnabled' does not exist o... Remove this comment to see the full error message
    setIsSearchModeEnabled,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'isSearchModeEnabled' does not exist on t... Remove this comment to see the full error message
    isSearchModeEnabled,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'jumpToLong' does not exist on type 'null... Remove this comment to see the full error message
    jumpToLong,
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'onFabSearch' does not exist on type 'nul... Remove this comment to see the full error message
    onFabSearch,
  } = upperContext;
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'setSwipeEnabled' does not exist on type ... Remove this comment to see the full error message
    params: { setSwipeEnabled: setViewPagerSwipeEnabled },
  } = useRoute();

  const contextValue = useMemo(
    () => ({
      // @ts-expect-error ts-migrate(2698) FIXME: Spread types may only be created from object types... Remove this comment to see the full error message
      ...upperContext,
      isFetchingEns,
      searchQuery,
      sectionListRef,
      setIsFetchingEns,
      setIsSearching,
    }),
    [
      searchQuery,
      upperContext,
      isFetchingEns,
      setIsFetchingEns,
      setIsSearching,
      sectionListRef,
    ]
  );
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
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'scrollToLocation' does not exist on type... Remove this comment to see the full error message
      sectionListRef.current?.scrollToLocation({
        animated: true,
        itemIndex: 0,
        sectionIndex: 0,
        viewOffset: 0,
        viewPosition: 0,
      });
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
      searchInputRef.current.focus();
    } else {
      setIsInputFocused(true);
      analytics.track('Tapped Search', {
        category: 'discover',
      });
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  onFabSearch.current = onTapSearch;

  useEffect(() => {
    if (!isSearchModeEnabled) {
      setSearchQuery('');
      setIsSearching(false);
      setIsFetchingEns(false);
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'blur' does not exist on type 'never'.
      searchInputRef.current?.blur();
      setIsInputFocused(false);
      // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
    } else if (!searchInputRef.current.isFocused()) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'focus' does not exist on type 'never'.
      searchInputRef.current?.focus();
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Row>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <Column flex={1} marginTop={19}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <ExchangeSearch
            clearTextOnFocus={false}
            isDiscover
            isFetching={loadingAllTokens || isFetchingEns}
            isSearching={isSearching}
            onBlur={() => setIsInputFocused(false)}
            onChangeText={setSearchQuery}
            onFocus={onTapSearch}
            placeholderText={
              isSearchModeEnabled
                ? 'Search all of Ethereum'
                : '􀊫 Search all of Ethereum'
            }
            ref={searchInputRef}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <CancelButton
          onPress={() => {
            // @ts-expect-error ts-migrate(2339) FIXME: Property 'blur' does not exist on type 'never'.
            searchInputRef.current?.blur();
            setIsInputFocused(false);
            sendQueryAnalytics(searchQuery);
          }}
          testID="done-button"
        >
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {delayedShowSearch && <CancelText>Done</CancelText>}
        </CancelButton>
      </Row>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
});
