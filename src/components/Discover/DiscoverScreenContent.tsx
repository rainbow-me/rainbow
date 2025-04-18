import React from 'react';
import { View } from 'react-native';
import DiscoverHome from '@/components/Discover/DiscoverHome';
import DiscoverSearch from '@/components/Discover/DiscoverSearch';
import { Box, Inset } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';

export function DiscoverScreenContent() {
  const insets = useSafeAreaInsets();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  return (
    <Box style={{ flex: 1 }} testID="discover-home">
      <Inset bottom={{ custom: insets.bottom }}>
        {/* TODO: without this empty view, the app crashes with no error. Something in the discover search cannot handle display: none */}
        <View>{isSearching ? <DiscoverSearch /> : <View />}</View>
        <View style={{ display: isSearching ? 'none' : 'flex' }}>
          <DiscoverHome />
        </View>
      </Inset>
    </Box>
  );
}
