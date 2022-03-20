import { useDeepCompareMemo } from 'use-deep-compare';
import { AssetListType } from '..';
import { CellType, CoinExtraData, NFTFamilyExtraData } from './ViewTypes';
import {
  useCoinListEdited,
  useCoinListEditOptions,
  useExternalWalletSectionsData,
  useOpenFamilies,
  useOpenInvestmentCards,
  useOpenSavings,
  useOpenSmallBalances,
  useWalletSectionsData,
} from '@rainbow-me/hooks';

const FILTER_TYPES = {
  'ens-profile': [
    CellType.NFT_SPACE_AFTER,
    CellType.NFT,
    CellType.FAMILY_HEADER,
  ],
} as { [key in AssetListType]: CellType[] };

export default function useMemoBriefSectionData({
  address,
  filterTypes: overrideFilterTypes,
  type,
}: { address?: string; filterTypes?: CellType[]; type?: AssetListType } = {}) {
  const { briefSectionsData }: { briefSectionsData: any[] } = address
    ? // `address` is a static prop, so hooks will always execute in order.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useExternalWalletSectionsData({ address })
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useWalletSectionsData();
  const { isSmallBalancesOpen, stagger } = useOpenSmallBalances();
  const { isSavingsOpen } = useOpenSavings();
  const { isInvestmentCardsOpen } = useOpenInvestmentCards();
  const { isCoinListEdited } = useCoinListEdited();
  const { hiddenCoins } = useCoinListEditOptions();
  const { openFamilies } = useOpenFamilies();

  const result = useDeepCompareMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
    let afterCoins = false;
    // load firstly 12, then the rest after 1 sec
    let numberOfSmallBalancesAllowed = stagger ? 12 : briefSectionsData.length;
    const filterTypes =
      overrideFilterTypes || type ? FILTER_TYPES[type as AssetListType] : [];
    const briefSectionsDataFiltered = briefSectionsData
      .filter((data, arrIndex, arr) => {
        if (
          filterTypes &&
          filterTypes.length !== 0 &&
          !filterTypes.includes(data.type)
        ) {
          return false;
        }

        if (
          arr[arrIndex - 1]?.type === CellType.COIN &&
          data.type !== CellType.COIN_DIVIDER &&
          data.type !== CellType.COIN
        ) {
          afterCoins = true;
        }
        if (afterCoins && isCoinListEdited) {
          return false;
        }

        // removes NFTS_HEADER if wallet doesn't have NFTs
        if (data.type === CellType.NFTS_HEADER && !arr[arrIndex + 2]) {
          return false;
        }

        if (
          data.type === CellType.ASSETS_HEADER ||
          data.type === CellType.NFTS_HEADER
        ) {
          stickyHeaders.push(index);
        }
        if (
          data.type === CellType.COIN &&
          !isSmallBalancesOpen &&
          !isCoinListEdited &&
          afterDivider
        ) {
          return false;
        }
        if (
          data.type === CellType.COIN &&
          hiddenCoins.includes((data as CoinExtraData).uniqueId) &&
          !isCoinListEdited
        ) {
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

        if (data.type === CellType.SAVINGS && !isSavingsOpen) {
          return false;
        }

        if (data.type === CellType.FAMILY_HEADER) {
          const name = (data as NFTFamilyExtraData).name;
          isGroupOpen = openFamilies[name];
        }

        if (
          data.type === CellType.NFT ||
          data.type === CellType.NFT_SPACE_AFTER
        ) {
          return isGroupOpen;
        }

        if (
          (data.type === CellType.POOLS_HEADER ||
            data.type === CellType.UNISWAP_POOL) &&
          isCoinListEdited
        ) {
          return false;
        }

        if (data.type === CellType.UNISWAP_POOL && !isInvestmentCardsOpen) {
          return false;
        }

        index++;
        return true;
      })
      .map(({ uid, type: cellType }) => {
        return { type: cellType, uid };
      });
    return briefSectionsDataFiltered;
  }, [
    briefSectionsData,
    isSmallBalancesOpen,
    isSavingsOpen,
    isInvestmentCardsOpen,
    isCoinListEdited,
    openFamilies,
    stagger,
  ]);
  const memoizedResult = useDeepCompareMemo(() => result, [result]);
  const additionalData = useDeepCompareMemo(
    () =>
      briefSectionsData.reduce((acc, data) => {
        acc[data.uid] = data;
        return acc;
      }, {}),
    [briefSectionsData]
  );
  return { additionalData, memoizedResult };
}
