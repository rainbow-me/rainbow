import React, { useContext, useMemo, useRef, useState } from 'react';
import { LayoutAnimation } from 'react-native';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { ExchangeSearch } from '../exchange';
import { Column, ColumnWithMargins, Row } from '../layout';
import { Text } from '../text';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSheetContext from './DiscoverSheetContext';
import { useUniswapAssets } from '@rainbow-me/hooks';
import { colors } from '@rainbow-me/styles';

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
})``;

const CancelButton = styled(ButtonPressAnimation)`
  margin-top: 27;
  margin-right: 19;
`;

function DiscoverSearchContainer({ children, showSearch, setShowSearch }) {
  const searchInputRef = useRef();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const upperConstext = useContext(DiscoverSheetContext);

  const contextValue = useMemo(
    () => ({ ...upperConstext, searchQuery, setIsSearching }),
    [searchQuery, upperConstext, setIsSearching]
  );
  const setIsInputFocusedWithLayoutAnimation = value => {
    setShowSearch(value);

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
          {showSearch && (
            <Text
              align="right"
              color={colors.appleBlue}
              letterSpacing="roundedMedium"
              size="large"
              weight="semibold"
            >
              Cancel
            </Text>
          )}
        </CancelButton>
      </Row>
      <DiscoverSheetContext.Provider value={contextValue}>
        {children}
      </DiscoverSheetContext.Provider>
    </>
  );
}

export default function DiscoverSheetContent() {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <>
      <HeaderTitle>{showSearch ? 'Search' : 'Discover'}</HeaderTitle>
      <ColumnWithMargins flex={1} margin={42}>
        <DiscoverSearchContainer
          setShowSearch={setShowSearch}
          showSearch={showSearch}
        >
          {showSearch ? <DiscoverSearch /> : <DiscoverHome />}
        </DiscoverSearchContainer>
      </ColumnWithMargins>
    </>
  );
}
