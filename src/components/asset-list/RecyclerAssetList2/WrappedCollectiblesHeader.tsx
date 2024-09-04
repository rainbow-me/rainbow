import React from 'react';
import { Box, Inline, Text } from '@/design-system';
import * as i18n from '@/languages';
import { ListHeaderMenu } from '@/components/list/ListHeaderMenu';
import { NftCollectionSortCriterion } from '@/graphql/__generated__/arc';
import useNftSort from '@/hooks/useNFTsSortBy';
import { useRemoteConfig } from '@/model/remoteConfig';
import { NFTS_ENABLED, useExperimentalFlag } from '@/config';
import { IS_TEST } from '@/env';

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
  const { nfts_enabled } = useRemoteConfig();
  const nftsEnabled = (useExperimentalFlag(NFTS_ENABLED) || nfts_enabled) && !IS_TEST;
  const { nftSort, updateNFTSort } = useNftSort();

  if (!nftsEnabled) return null;

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
          menuItems={Object.entries(NftCollectionSortCriterion).map(([key, value]) => ({
            actionKey: value,
            actionTitle: i18n.t(i18n.l.nfts.sort[value]),
            icon: { iconType: 'SYSTEM', iconValue: getMenuItemIcon(value) },
            menuState: nftSort === key ? 'on' : 'off',
          }))}
          selectItem={string => updateNFTSort(string as NftCollectionSortCriterion)}
          icon={getIconForSortType(nftSort)}
          text={i18n.t(i18n.l.nfts.sort[nftSort])}
        />
      </Inline>
    </Box>
  );
};

CollectiblesHeader.height = TokenFamilyHeaderHeight;

export default CollectiblesHeader;
