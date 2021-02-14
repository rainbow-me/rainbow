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
  useImperativeHandle(ref, () => searchInputRef.current);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const upperContext = useContext(DiscoverSheetContext);
  const { setIsSearchModeEnabled, isSearchModeEnabled } = upperContext;
  const {
    params: { setSwipeEnabled: setViewPagerSwipeEnabled },
  } = useRoute();

  const contextValue = useMemo(
    () => ({ ...upperContext, searchQuery, setIsSearching }),
    [searchQuery, upperContext, setIsSearching]
  );
  const setIsInputFocused = useCallback(
    value => {
      setShowSearch(value);
      setIsSearchModeEnabled(value);
      setViewPagerSwipeEnabled(!value);
    },
    [setIsSearchModeEnabled, setShowSearch, setViewPagerSwipeEnabled]
  );

  upperContext.onFabSearch.current = setIsInputFocused;

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
            onFocus={() => {
              upperContext.jumpToLong?.();
              setIsInputFocused(true);
            }}
            placeholderText="Search all of Ethereum"
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
        >
          {delayedShowSearch && <CancelText>Cancel</CancelText>}
        </CancelButton>
      </Row>
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
});
