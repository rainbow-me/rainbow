import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';
import { Box, Inline, Text } from '@/design-system';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { NftSort, useNftSort } from '@/hooks/useNFTsSortBy';
import * as i18n from '@/languages';
import { colors } from '@/styles';
import React from 'react';

const TokenFamilyHeaderHeight = 48;

const getIconForSortType = (selected: NftCollectionSortCriterion) => {
  switch (selected) {
    case NftCollectionSortCriterion.Abc:
      return '􀋲';
    case NftCollectionSortCriterion.FloorPrice:
      return '􀅺';
    case NftCollectionSortCriterion.MostRecent:
      return '􀐫';
  }
};

const getMenuItemIcon = (value: NftCollectionSortCriterion) => {
  switch (value) {
    case NftCollectionSortCriterion.Abc:
      return 'list.bullet';
    case NftCollectionSortCriterion.FloorPrice:
      return 'plus.forwardslash.minus';
    case NftCollectionSortCriterion.MostRecent:
      return 'clock';
  }
};

const CollectiblesHeader = () => {
  const { nftSort, nftSortDirection, updateNFTSort } = useNftSort();
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
          selected={`${nftSort}|${nftSortDirection}`}
          menuItems={Object.values(NftCollectionSortCriterion).map(sortCriterion => {
            return {
              icon: { iconType: 'SYSTEM', iconValue: getMenuItemIcon(sortCriterion) },
              ...(nftSort === sortCriterion
                ? {
                    menuTitle: i18n.t(i18n.l.nfts.sort[sortCriterion]),
                    menuPreferredElementSize: 'small',
                    menuState: 'on',
                    menuItems: [
                      {
                        actionKey: `${sortCriterion}|${SortDirection.Asc}`,
                        actionTitle: 'Ascending order',
                        icon: {
                          iconType: 'SYSTEM',
                          iconValue: 'arrow.up.circle',
                          iconTint: nftSortDirection === SortDirection.Asc ? undefined : colors.grey,
                        },
                      },
                      {
                        actionKey: `${sortCriterion}|${SortDirection.Desc}`,
                        actionTitle: 'Descending order',
                        icon: {
                          iconType: 'SYSTEM',
                          iconValue: 'arrow.down.circle',
                          iconTint: nftSortDirection === SortDirection.Desc ? undefined : colors.grey,
                        },
                      },
                    ],
                  }
                : {
                    actionKey: `${sortCriterion}|${SortDirection.Desc}`,
                    actionTitle: i18n.t(i18n.l.nfts.sort[sortCriterion]),
                    menuState: 'off',
                  }),
            };
          })}
          selectItem={string => updateNFTSort(string as NftSort)}
          icon={getIconForSortType(nftSort)}
          text={i18n.t(i18n.l.nfts.sort[nftSort])}
        />
      </Inline>
    </Box>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default CollectiblesHeader;
