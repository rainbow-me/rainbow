import React, { useContext, useMemo, useRef, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { ExchangeSearch } from '../exchange';
import { Column, Row } from '../layout';
import { Text } from '../text';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useUniswapAssets } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const CancelButton = styled(ButtonPressAnimation)`
  margin-top: 27;
  right: 15;
`;

const CancelText = styled(Text).attrs({
  align: 'right',
  color: colors.appleBlue,
  letterSpacing: 'roundedMedium',
  size: 'large',
  weight: 'semibold',
})`
  margin-left: 12;
`;

export default function DiscoverSearchContainer({
  children,
  showSearch,
  setShowSearch,
}) {
  const searchInputRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const upperContext = useContext(DiscoverSheetContext);
  const { setIsSearchModeEnabled } = upperContext;

  const contextValue = useMemo(
    () => ({ ...upperContext, searchQuery, setIsSearching }),
    [searchQuery, upperContext, setIsSearching]
  );
  const setIsInputFocusedWithLayoutAnimation = value => {
    setShowSearch(value);
    setIsSearchModeEnabled(!value);

    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
  };
  const { loadingAllTokens } = useUniswapAssets();
  return (
    <>
      <Row>
        <Column flex={1} marginTop={19}>
          <ExchangeSearch
            isFetching={loadingAllTokens}
            isSearching={isSearching}
            onBlur={() => setIsInputFocusedWithLayoutAnimation(false)}
            onChangeText={setSearchQuery}
            onFocus={() => setIsInputFocusedWithLayoutAnimation(true)}
            placeholderText="Search all of Ethereum"
            ref={searchInputRef}
            searchQuery={searchQuery}
            testID="discover-search"
          />
        </Column>
        <CancelButton
          onPress={() => {
            searchInputRef.current?.blur();
            setIsInputFocusedWithLayoutAnimation(false);
          }}
        >
          {showSearch && <CancelText>Cancel</CancelText>}
        </CancelButton>
      </Row>
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
}
