import { useMemo } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { AssetListType } from '..';
import { CellType, CellTypes, CoinExtraData, NFTFamilyExtraData } from './ViewTypes';
import { useCoinListEdited, useExternalWalletSectionsData, useOpenFamilies, useWalletSectionsData } from '@/hooks';
import useOpenPositionCards from '@/hooks/useOpenPositionCards';
import useOpenClaimables from '@/hooks/useOpenClaimables';
import { useUserAssetsStore } from '@/state/assets/userAssets';
import { useOpenSmallBalances } from '@/state/wallets/smallBalancesStore';

const FILTER_TYPES = {
  'ens-profile': [CellType.NFT_SPACE_AFTER, CellType.NFT, CellType.FAMILY_HEADER],
  'select-nft': [CellType.NFT_SPACE_AFTER, CellType.NFT, CellType.FAMILY_HEADER],
} as { [key in AssetListType]: CellType[] };

export default function useMemoBriefSectionData({
  externalAddress,
  type,
  briefSectionsData,
}: {
  externalAddress?: string;
  type?: AssetListType;
  briefSectionsData?: CellTypes[];
} = {}) {
  let sectionsDataToUse: CellTypes[];

  if (type === 'ens-profile') {
    // `type` is a static prop, so hooks will always execute in order.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sectionsDataToUse = useExternalWalletSectionsData({
      address: externalAddress,
      type,
    }).briefSectionsData;
  } else if (!briefSectionsData) {
    // briefSectionsData is an optional thing - we might send it from the tree
    // so we run it only once for a tree
    // eslint-disable-next-line react-hooks/rules-of-hooks
    sectionsDataToUse = useWalletSectionsData({ type }).briefSectionsData!;
  } else {
    sectionsDataToUse = briefSectionsData;
  }

  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isPositionCardsOpen } = useOpenPositionCards();
  const { isClaimablesOpen } = useOpenClaimables();
  const { isCoinListEdited } = useCoinListEdited();
  const hiddenAssets = useUserAssetsStore(state => state.hiddenAssets);
  const { openFamilies } = useOpenFamilies();

  const result = useMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
    let afterCoins = false;
    // load firstly 12, then the rest after 1 sec
    let numberOfSmallBalancesAllowed = sectionsDataToUse.length;
    const filterTypes = type ? FILTER_TYPES[type as AssetListType] : [];
    const briefSectionsDataFiltered = sectionsDataToUse
      .filter((data, arrIndex, arr) => {
        if (filterTypes && filterTypes.length !== 0 && !filterTypes.includes(data.type)) {
          return false;
        }

        if (arr[arrIndex - 1]?.type === CellType.COIN && data.type !== CellType.COIN_DIVIDER && data.type !== CellType.COIN) {
          afterCoins = true;
        }
        if (afterCoins && isCoinListEdited) {
          return false;
        }

        if (data.type === CellType.PROFILE_STICKY_HEADER) {
          stickyHeaders.push(index);
        }
        if (data.type === CellType.COIN && !isSmallBalancesOpen && !isCoinListEdited && afterDivider) {
          return false;
        }
        if (data.type === CellType.COIN && hiddenAssets.has((data as CoinExtraData).uniqueId) && !isCoinListEdited) {
          return false;
        }

        if (data.type === CellType.COIN_DIVIDER) {
          afterDivider = true;
        }

        if (afterDivider && data.type === CellType.COIN) {
          numberOfSmallBalancesAllowed--;
          if (numberOfSmallBalancesAllowed <= 0) {
            return false;
          }
        }

        if (data.type === CellType.FAMILY_HEADER) {
          const name = (data as NFTFamilyExtraData).name;
          isGroupOpen = openFamilies[name];
        }

        if (data.type === CellType.NFT || data.type === CellType.NFT_SPACE_AFTER) {
          return isGroupOpen;
        }

        if (data.type === CellType.POSITION && !isPositionCardsOpen) {
          return false;
        }

        if (data.type === CellType.CLAIMABLE && !isClaimablesOpen) {
          return false;
        }

        index++;
        return true;
      })
      .map(({ uid, type: cellType }) => {
        return { type: cellType, uid };
      });
    return briefSectionsDataFiltered;
  }, [sectionsDataToUse, type, isCoinListEdited, isSmallBalancesOpen, hiddenAssets, isPositionCardsOpen, isClaimablesOpen, openFamilies]);
  const memoizedResult = useDeepCompareMemo(() => result, [result]);
  const additionalData = useDeepCompareMemo(
    () =>
      sectionsDataToUse.reduce(
        (acc, data) => {
          acc[data.uid] = data;
          return acc;
        },
        {} as Record<string, CellTypes>
      ),
    [sectionsDataToUse]
  );
  return { additionalData, memoizedResult };
}
