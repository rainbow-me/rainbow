import lang from 'i18n-js';
import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { ColumnWithMargins, FlexItem } from '../layout';
import { Text } from '../text';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSearchContainer from './DiscoverSearchContainer';
import styled from '@rainbow-me/styled-components';

const HeaderTitle = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.dark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
}))({
  marginTop: 2,
});

const Spacer = styled.View({
  height: 16,
});

function Switcher({ showSearch, children }) {
  return (
    <>
      <View style={{ display: showSearch ? 'flex' : 'none' }}>
        {showSearch ? children[0] : <FlexItem />}
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
        {showSearch
          ? lang.t('discover.title_search')
          : lang.t('discover.title_discover')}
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
