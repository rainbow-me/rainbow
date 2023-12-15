import React from 'react';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';

import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';

import useNftSort, { CollectibleSortByOptions } from '@/hooks/useNFTsSortBy';

const TokenFamilyHeaderHeight = 44;

const CollectiblesHeader = () => {
  const { nftSort, updateNFTSort } = useNftSort();

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
    return '';
  };
  return (
    <>
      <Box
        height={{ custom: TokenFamilyHeaderHeight }}
        paddingHorizontal={'19px (Deprecated)'}
        justifyContent="center"
        key={`collectibles_${nftSort}`}
        testID={`collectibles-list-header`}
      >
        <Inline alignHorizontal="justify">
          <Text size="22pt" color={'label'} weight="heavy">
            {i18n.t(i18n.l.account.tab_collectibles)}
          </Text>

          <ListHeaderMenu
            selected={nftSort}
            menuItems={Object.entries(CollectibleSortByOptions).map(
              ([key, value]) => ({
                actionKey: value,
                actionTitle: i18n.t(i18n.l.nfts.sort[value]),
                icon: { iconType: 'SYSTEM', iconValue: getMenuItemIcon(value) },
                menuState: nftSort === key ? 'on' : 'off',
              })
            )}
            selectItem={string =>
              updateNFTSort(string as CollectibleSortByOptions)
            }
            text={`${getIconForSortType(nftSort)} ${i18n.t(
              i18n.l.nfts.sort[nftSort]
            )}`}
          />
        </Inline>
      </Box>
    </>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default CollectiblesHeader;
