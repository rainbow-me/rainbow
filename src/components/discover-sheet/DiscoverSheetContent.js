import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import styled from 'styled-components';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSearchContainer from './DiscoverSearchContainer';

const HeaderTitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
}))``;

const Spacer = styled.View`
  height: 16;
`;

function Switcher({ showSearch, children }) {
  return (
    <>
      <View style={{ display: showSearch ? 'flex' : 'none' }}>
        {children[0]}
      </View>
      <View style={{ display: showSearch ? 'none' : 'flex' }}>
        {children[1]}
      </View>
    </>
  );
}

export default function DiscoverSheetContent() {
  const [showSearch, setShowSearch] = useState(false);
  const ref = useRef();

  return (
    <>
      {android && <Spacer />}
      <HeaderTitle
        testID={showSearch ? 'discover-header-search' : 'discover-header'}
      >
        {showSearch ? 'Search' : 'Discover'}
      </HeaderTitle>
      <ColumnWithMargins flex={1} margin={42} testID="discover-home">
        <DiscoverSearchContainer
          ref={ref}
          setShowSearch={setShowSearch}
          showSearch={showSearch}
        >
          <Switcher showSearch={showSearch}>
            <DiscoverSearch />
            <DiscoverHome />
          </Switcher>
        </DiscoverSearchContainer>
      </ColumnWithMargins>
    </>
  );
}
