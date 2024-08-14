import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';
import { Box, Inline, Text } from '@/design-system';
import useNftSort, { CollectibleSortByOptions } from '@/hooks/useNFTsSortBy';
import * as i18n from '@/languages';
import React from 'react';

const TokenFamilyHeaderHeight = 48;

const getIconForSortType = (selected: string) => {
  switch (selected) {
    case CollectibleSortByOptions.ABC:
      return '􀋲';
    case CollectibleSortByOptions.FLOOR_PRICE:
      return '􀅺';
    case CollectibleSortByOptions.MOST_RECENT:
      return '􀐫';
  }
  return '';
};

const getMenuItemIcon = (value: CollectibleSortByOptions) => {
  switch (value) {
    case CollectibleSortByOptions.ABC:
      return 'list.bullet';
    case CollectibleSortByOptions.FLOOR_PRICE:
      return 'plus.forwardslash.minus';
    case CollectibleSortByOptions.MOST_RECENT:
      return 'clock';
  }
};

const CollectiblesHeader = () => {
  const { nftSort, updateNFTSort } = useNftSort();
  return (
    <Box
      height={{ custom: TokenFamilyHeaderHeight }}
      paddingBottom="2px"
      paddingHorizontal={'19px (Deprecated)'}
      justifyContent="flex-end"
      key={`collectibles_${nftSort}`}
      testID={`collectibles-list-header`}
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Text size="22pt" color={'label'} weight="heavy">
          {i18n.t(i18n.l.account.tab_collectibles)}
        </Text>

        <ListHeaderMenu
          selected={nftSort}
          menuItems={Object.entries(CollectibleSortByOptions).map(([key, value]) => ({
            actionKey: value,
            actionTitle: i18n.t(i18n.l.nfts.sort[value]),
            icon: { iconType: 'SYSTEM', iconValue: getMenuItemIcon(value) },
            menuState: nftSort === key ? 'on' : 'off',
          }))}
          selectItem={string => updateNFTSort(string as CollectibleSortByOptions)}
          icon={getIconForSortType(nftSort)}
          text={i18n.t(i18n.l.nfts.sort[nftSort])}
        />
      </Inline>
    </Box>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default CollectiblesHeader;
