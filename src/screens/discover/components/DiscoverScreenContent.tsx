import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { FlexItem } from '@/components/layout';
import DiscoverHome from './DiscoverHome';
import DiscoverSearch from './DiscoverSearch';
import DiscoverSearchContainer from './DiscoverSearchContainer';
import { Box, Inset } from '@/design-system';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDiscoverScreenContext } from '../DiscoverScreenContext';

type SwitcherProps = { showSearch: boolean; children: React.ReactNode[] };
function Switcher({ showSearch, children }: SwitcherProps) {
  return (
    <>
      <View style={{ display: showSearch ? 'flex' : 'none' }}>{showSearch ? children[0] : <FlexItem />}</View>
      <View style={{ display: showSearch ? 'none' : 'flex' }}>{children[1]}</View>
    </>
  );
}

export default function DiscoverScreenContent() {
  const { isSearching } = useDiscoverScreenContext();

  const insets = useSafeAreaInsets();

  return (
    <Box style={sx.container} testID="discover-home">
      <Inset top="8px" bottom={{ custom: insets.bottom }}>
        <DiscoverSearchContainer>
          <Switcher showSearch={isSearching}>
            <DiscoverSearch />
            <DiscoverHome />
          </Switcher>
        </DiscoverSearchContainer>
      </Inset>
    </Box>
  );
}

const sx = StyleSheet.create({
  container: {
    flex: 1,
  },
});
