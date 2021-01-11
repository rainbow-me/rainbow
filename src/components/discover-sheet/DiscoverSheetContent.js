import React, { useState } from 'react';
import styled from 'styled-components/primitives';
import { ColumnWithMargins } from '../layout';
import { Text } from '../text';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSearchContainer from './DiscoverSearchContainer';
import { colors } from '@rainbow-me/styles';

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.alpha(colors.blueGreyDark, 0.8),
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  size: 'large',
  weight: 'heavy',
})``;

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
          {showSearch ? <DiscoverSearch /> : null}
          <DiscoverHome />
        </DiscoverSearchContainer>
      </ColumnWithMargins>
    </>
  );
}
