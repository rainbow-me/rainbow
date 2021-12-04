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
  const { isSmallBalancesOpen } = useOpenSmallBalances();
  const { isSavingsOpen } = useOpenSavings();
  const { isInvestmentCardsOpen } = useOpenInvestmentCards();
  const { isCoinListEdited } = useCoinListEdited();
  const { openFamilies } = useOpenFamilies();

  const result = useDeepCompareMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    const stickyHeaders = [];
    let index = 0;
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

        if (data.type === CellType.SAVINGS && !isSavingsOpen) {
          return false;
        }

        if (data.type === CellType.FAMILY_HEADER) {
          const name = (data as NFTFamilyExtraData).name;
          const showcase = name === 'Showcase';
          isGroupOpen = openFamilies[name + (showcase ? '-showcase' : '')];
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
  ]);
  const memoizedResult = useDeepCompareMemo(() => result, [result]);
  const additionalData = briefSectionsData.reduce((acc, data) => {
    acc[data.uid] = data;
    return acc;
  }, {});
  return { additionalData, memoizedResult };
}
