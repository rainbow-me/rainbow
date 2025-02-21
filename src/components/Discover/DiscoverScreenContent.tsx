import React from 'react';
import { View } from 'react-native';
import { FlexItem, Page } from '@/components/layout';
import DiscoverHome from '@/components/Discover/DiscoverHome';
import DiscoverSearch from '@/components/Discover/DiscoverSearch';
import DiscoverSearchContainer from '@/components/Discover/DiscoverSearchContainer';
import { Box, Inset } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';

function Switcher({ children }: { children: React.ReactNode[] }) {
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  return (
    <>
      <View style={{ display: isSearching ? 'flex' : 'none' }}>{isSearching ? children[0] : <FlexItem />}</View>
      <View style={{ display: isSearching ? 'none' : 'flex' }}>{children[1]}</View>
    </>
  );
}

export default function DiscoverScreenContent() {
  const insets = useSafeAreaInsets();

  return (
    <Box as={Page} flex={1} testID="discover-home">
      <Inset top="8px" bottom={{ custom: insets.bottom }}>
        <DiscoverSearchContainer>
          <Switcher>
            <DiscoverSearch />
            <DiscoverHome />
          </Switcher>
        </DiscoverSearchContainer>
      </Inset>
    </Box>
  );
}
