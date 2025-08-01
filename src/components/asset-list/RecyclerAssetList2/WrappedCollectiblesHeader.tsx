import React from 'react';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
// import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';
// import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
// import { colors } from '@/styles';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
// import { IS_IOS } from '@/env';
// import { nftsStoreManager } from '@/state/nfts/nftsStoreManager';

const TokenFamilyHeaderHeight = 48;

// const getIconForSortType = (selected: NftCollectionSortCriterion) => {
//   switch (selected) {
//     case NftCollectionSortCriterion.Abc:
//       return '􀋲';
//     case NftCollectionSortCriterion.FloorPrice:
//       return '􀅺';
//     case NftCollectionSortCriterion.MostRecent:
//       return '􀐫';
//   }
// };

// const getMenuItemIcon = (value: NftCollectionSortCriterion) => {
//   switch (value) {
//     case NftCollectionSortCriterion.Abc:
//       return 'list.bullet';
//     case NftCollectionSortCriterion.FloorPrice:
//       return 'plus.forwardslash.minus';
//     case NftCollectionSortCriterion.MostRecent:
//       return 'clock';
//   }
// };

const CollectiblesHeader = () => {
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  // TODO: Bring this back once we can sort with pagination
  // const sortBy = nftsStoreManager(state => state.sortBy);
  // const sortDirection = nftsStoreManager(state => state.sortDirection);
  // const updateNFTSort = nftsStoreManager(state => state.updateSort);

  if (!nftsEnabled) return null;

  return (
    <Box
      height={{ custom: TokenFamilyHeaderHeight }}
      paddingBottom="2px"
      paddingHorizontal={'19px (Deprecated)'}
      justifyContent="flex-end"
      // TODO: Bring this back once we can sort with pagination
      // key={`collectibles_${sortBy}`}
      testID={`collectibles-list-header`}
    >
      <Inline alignHorizontal="justify" alignVertical="center">
        <Text size="22pt" color={'label'} weight="heavy">
          {i18n.t(i18n.l.account.tab_collectibles)}
        </Text>

        {/* TODO: Bring this back once we can sort with pagination */}
        {/* <ListHeaderMenu
          selected={`${sortBy}|${sortDirection}`}
          menuItems={Object.values(NftCollectionSortCriterion).map(sortCriterion => {
            return {
              icon: { iconType: 'SYSTEM', iconValue: getMenuItemIcon(sortCriterion) },
              ...(sortBy === sortCriterion && IS_IOS // submenus look weird in android, so it toggles when clicking the same item
                ? {
                    menuTitle: i18n.t(i18n.l.nfts.sort[sortCriterion]),
                    menuPreferredElementSize: 'small',
                    menuState: 'on',
                    menuItems: [
                      {
                        actionKey: `${sortCriterion}|${SortDirection.Asc}`,
                        actionTitle: i18n.t(i18n.l.nfts.sort.order.asc),
                        icon: {
                          iconType: 'SYSTEM',
                          iconValue: 'arrow.up.circle',
                          iconTint: sortDirection === SortDirection.Asc ? colors.grey : undefined,
                        },
                      },
                      {
                        actionKey: `${sortCriterion}|${SortDirection.Desc}`,
                        actionTitle: i18n.t(i18n.l.nfts.sort.order.desc),
                        icon: {
                          iconType: 'SYSTEM',
                          iconValue: 'arrow.down.circle',
                          iconTint: sortDirection === SortDirection.Desc ? colors.grey : undefined,
                        },
                      },
                    ],
                  }
                : {
                    actionKey: `${sortCriterion}|${sortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc}`,
                    actionTitle: i18n.t(i18n.l.nfts.sort[sortCriterion]),
                    menuState: 'off',
                  }),
            };
          })}
          selectItem={updateNFTSort}
          icon={getIconForSortType(sortBy)}
          text={i18n.t(i18n.l.nfts.sort[sortBy])}
        /> */}
      </Inline>
    </Box>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default React.memo(CollectiblesHeader);
