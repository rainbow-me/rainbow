import React, { useRef, useState } from 'react';
import { View } from 'react-native';
import { FlexItem } from '@/components/layout';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSearchContainer from './DiscoverSearchContainer';
import { Box, Inset } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function Switcher({ showSearch, children }) {
  return (
    <>
      <View style={{ display: showSearch ? 'flex' : 'none' }}>{showSearch ? children[0] : <FlexItem />}</View>
      <View style={{ display: showSearch ? 'none' : 'flex' }}>{children[1]}</View>
    </>
  );
}

export default function DiscoverScreenContent() {
  const [showSearch, setShowSearch] = useState(false);
  const ref = useRef();

  const insets = useSafeAreaInsets();

  return (
    <Box flex={1} testID="discover-home">
      <Inset top="8px" bottom={{ custom: insets.bottom }}>
        <DiscoverSearchContainer ref={ref} setShowSearch={setShowSearch} showSearch={showSearch}>
          <Switcher showSearch={showSearch}>
            <DiscoverSearch />
            <DiscoverHome />
          </Switcher>
        </DiscoverSearchContainer>
      </Inset>
    </Box>
  );
}
