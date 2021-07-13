import { useRoute } from '@react-navigation/native';
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
import styled from 'styled-components';
import { ButtonPressAnimation } from '../animations';
import { ExchangeSearch } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
import DiscoverSheetContext from './DiscoverSheetContext';
import {
  useDelayedValueWithLayoutAnimation,
  useUniswapAssets,
} from '@rainbow-me/hooks';

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
  ${ios ? '' : 'margin-top: -5;'}
  margin-left: -3;
  margin-right: 15;
`;

export default forwardRef(function DiscoverSearchContainer(
  { children, showSearch, setShowSearch },
  ref
) {
  const searchInputRef = useRef();
  const sectionListRef = useRef();
  useImperativeHandle(ref, () => searchInputRef.current);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
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

  const contextValue = useMemo(
    () => ({ ...upperContext, searchQuery, sectionListRef, setIsSearching }),
    [searchQuery, upperContext, setIsSearching, sectionListRef]
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
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  onFabSearch.current = onTapSearch;

  useEffect(() => {
    if (!isSearchModeEnabled) {
      setSearchQuery('');
      setIsSearching(false);
      searchInputRef.current?.blur();
      setIsInputFocused(false);
    } else if (!searchInputRef.current.isFocused()) {
      searchInputRef.current?.focus();
    }
  }, [isSearchModeEnabled, setIsInputFocused]);

  const delayedShowSearch = useDelayedValueWithLayoutAnimation(showSearch);

  const { loadingAllTokens } = useUniswapAssets();
  return (
    <>
      <Row>
        <Column flex={1} marginTop={19}>
          <ExchangeSearch
            clearTextOnFocus={false}
            isFetching={loadingAllTokens}
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
        <CancelButton
          onPress={() => {
            searchInputRef.current?.blur();
            setIsInputFocused(false);
          }}
          testID="done-button"
        >
          {delayedShowSearch && <CancelText>Done</CancelText>}
        </CancelButton>
      </Row>
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
});
