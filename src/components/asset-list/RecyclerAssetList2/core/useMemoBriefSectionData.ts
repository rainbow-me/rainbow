import { useMemo } from 'react';
import { useDeepCompareMemo } from 'use-deep-compare';
import { CellType, CoinExtraData, NFTFamilyExtraData } from './ViewTypes';
import {
  useCoinListEdited,
  useCoinListEditOptions,
  useOpenFamilies,
  useOpenInvestmentCards,
  useOpenSavings,
  useOpenSmallBalances,
} from '@rainbow-me/hooks';

export default function useMemoBriefSectionData(briefSectionsData: any[]) {
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isSavingsOpen } = useOpenSavings();
  const { isInvestmentCardsOpen } = useOpenInvestmentCards();
  const { isCoinListEdited } = useCoinListEdited();
  const { hiddenCoinsObj } = useCoinListEditOptions();
  const { openFamilies } = useOpenFamilies();

  const result = useMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
    let afterCoins = false;
    // load firstly 12, then the rest after 1 sec
    let numberOfSmallBalancesAllowed = briefSectionsData.length;
    const briefSectionsDataFiltered = briefSectionsData
      .filter((data, arrIndex, arr) => {
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
          hiddenCoinsObj[(data as CoinExtraData).uniqueId] &&
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
      .map(({ uid, type }) => ({ type, uid }));
    return briefSectionsDataFiltered;
  }, [
    briefSectionsData,
    isSmallBalancesOpen,
    isSavingsOpen,
    isInvestmentCardsOpen,
    isCoinListEdited,
    openFamilies,
    hiddenCoinsObj,
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
