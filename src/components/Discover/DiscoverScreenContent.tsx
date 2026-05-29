import React, { type ReactElement } from 'react';
import { StyleSheet, View, type RefreshControlProps } from 'react-native';

import { type SharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDiscoverSearchQueryStore } from '@/__swaps__/screens/Swap/resources/search/searchV2';
import DiscoverSearch from '@/components/Discover/DiscoverSearch';
import { Box } from '@/design-system';
import { DiscoverSectionsPager } from '@/features/discover/components/DiscoverSectionsPager';

type DiscoverScreenContentProps = {
  renderRefreshControl?: () => ReactElement<RefreshControlProps>;
  scrollOffset: SharedValue<number>;
};

export function DiscoverScreenContent({ renderRefreshControl, scrollOffset }: DiscoverScreenContentProps) {
  const insets = useSafeAreaInsets();
  const isSearching = useDiscoverSearchQueryStore(state => state.isSearching);

  return (
    <Box style={styles.container} testID="discover-home">
      <View style={[styles.searchContainer, { marginBottom: insets.bottom }, !isSearching && styles.hidden]}>
        {/* without this empty view, the app crashes with no error. Something in the discover search cannot handle display: none */}
        <View>{isSearching ? <DiscoverSearch /> : <View />}</View>
      </View>

      <View style={[styles.sectionsContainer, isSearching && styles.hidden]}>
        <DiscoverSectionsPager renderRefreshControl={renderRefreshControl} scrollOffset={scrollOffset} />
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hidden: {
    display: 'none',
  },
  searchContainer: {
    flex: 1,
  },
  sectionsContainer: {
    flex: 1,
  },
});
