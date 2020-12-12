import React, { useCallback, useState } from 'react';
import styled from 'styled-components/primitives';
import { ColumnWithMargins } from '../layout';
import { SlackSheet } from '../sheet';
import { Text } from '../text';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSheetHeader from './DiscoverSheetHeader';

import { colors, position } from '@rainbow-me/styles';

const renderHeader = yPosition => <DiscoverSheetHeader yPosition={yPosition} />;

const HeaderTitle = styled(Text).attrs({
  align: 'center',
  color: colors.blueGreyDark,
  letterSpacing: 'roundedMedium',
  lineHeight: 'loose',
  opacity: 0.8,
  size: 'large',
  weight: 'bold',
})``;

export default function DiscoverSheetContent() {
  const [showSearch, setShowSearch] = useState(false);
  const handleSearchPress = useCallback(() => {
    // do something
    setShowSearch(true);
  }, []);
  const handleSearchCancel = useCallback(() => {
    // do something
    setShowSearch(false);
  }, []);

  return (
    <SlackSheet contentOffset={position.current} renderHeader={renderHeader}>
      <HeaderTitle>{showSearch ? 'Search' : 'Discover'}</HeaderTitle>
      <ColumnWithMargins flex={1} margin={42}>
        {showSearch ? (
          <DiscoverSearch onCancel={handleSearchCancel} />
        ) : (
          <DiscoverHome onSearchPress={handleSearchPress} />
        )}
      </ColumnWithMargins>
    </SlackSheet>
  );
}
