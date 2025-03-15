import React from 'react';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';
import { NftCollectionSortCriterion, SortDirection } from '@/graphql/__generated__/arc';
import { useNftSort } from '@/hooks/useNFTsSortBy';
import { colors } from '@/styles';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { IS_IOS } from '@/env';
import { deviceUtils } from '@/utils';

const CollectiblesHeaderHeight = 40;

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

export function CollectiblesHeader() {
  const { nftSort, nftSortDirection, updateNFTSort } = useNftSort();
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = useExperimentalFlag(NFTS_ENABLED) || nfts_enabled;

  if (!nftsEnabled) return null;

  return (
    <Box
      height={{ custom: CollectiblesHeaderHeight }}
      width={{ custom: deviceUtils.dimensions.width }}
      paddingHorizontal={'19px (Deprecated)'}
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
              ...(nftSort === sortCriterion && IS_IOS // submenus look weird in android, so it toggles when clicking the same item
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
                          iconTint: nftSortDirection === SortDirection.Asc ? colors.grey : undefined,
                        },
                      },
                      {
                        actionKey: `${sortCriterion}|${SortDirection.Desc}`,
                        actionTitle: i18n.t(i18n.l.nfts.sort.order.desc),
                        icon: {
                          iconType: 'SYSTEM',
                          iconValue: 'arrow.down.circle',
                          iconTint: nftSortDirection === SortDirection.Desc ? colors.grey : undefined,
                        },
                      },
                    ],
                  }
                : {
                    actionKey: `${sortCriterion}|${nftSortDirection === SortDirection.Asc ? SortDirection.Desc : SortDirection.Asc}`,
                    actionTitle: i18n.t(i18n.l.nfts.sort[sortCriterion]),
                    menuState: 'off',
                  }),
            };
          })}
          selectItem={updateNFTSort}
          icon={getIconForSortType(nftSort)}
          text={i18n.t(i18n.l.nfts.sort[nftSort])}
        />
      </Inline>
    </Box>
  );
}
