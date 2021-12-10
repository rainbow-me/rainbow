import { useDeepCompareMemo } from 'use-deep-compare';
import { CellType, NFTFamilyExtraData } from './ViewTypes';
import {
  useCoinListEdited,
  useOpenFamilies,
  useOpenInvestmentCards,
  useOpenSavings,
  useOpenSmallBalances,
  useWalletSectionsData,
} from '@rainbow-me/hooks';

export default function useMemoBriefSectionData() {
  const { briefSectionsData } = useWalletSectionsData();
  const { isSmallBalancesOpen, stagger } = useOpenSmallBalances();
  const { isSavingsOpen } = useOpenSavings();
  const { isInvestmentCardsOpen } = useOpenInvestmentCards();
  const { isCoinListEdited } = useCoinListEdited();
  const { openFamilies } = useOpenFamilies();

  const result = useDeepCompareMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
    // load firstly 12, then the rest after 1 sec
    let numberOfSmallBalancesAllowed = stagger ? 12 : briefSectionsData.length;
    const briefSectionsDataFiltered = briefSectionsData
      .filter(data => {
        if (
          data.type === CellType.ASSETS_HEADER ||
          data.type === CellType.NFTS_HEADER
        ) {
          stickyHeaders.push(index);
        }
        if (
          data.type === CellType.COIN &&
          !isSmallBalancesOpen &&
          afterDivider
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

        if (data.type === CellType.NFT) {
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
      .map(({ uid, type }) => ({ type, uid }));

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
  const additionalData = briefSectionsData.reduce((acc, data) => {
    acc[data.uid] = data;
    return acc;
  }, {});
  return { additionalData, memoizedResult };
}
