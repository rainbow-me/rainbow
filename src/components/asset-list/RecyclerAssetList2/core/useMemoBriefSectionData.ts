import { useDeepCompareMemo } from 'use-deep-compare';
import {
  BaseCellSuccinctType,
  CellType,
  CoinExtraData,
  NFTFamilyExtraData,
} from './ViewTypes';
import {
  useCoinListEdited,
  useCoinListEditOptions,
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
  const { hiddenCoins } = useCoinListEditOptions();
  const { openFamilies } = useOpenFamilies();

  const result = useDeepCompareMemo(() => {
    let afterDivider = false;
    let isGroupOpen = true;
    let isAnySmallBalance = false;
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
          afterDivider &&
          !hiddenCoins.includes(data.uid)
        ) {
          isAnySmallBalance = true;
        }

        if (
          data.type === CellType.COIN &&
          !isSmallBalancesOpen &&
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
      .map(({ uid, type }) => ({ type, uid }));

    const {
      result: briefSectionsDataFilteredSorted,
    } = briefSectionsDataFiltered.reduce(
      (acc, curr) => {
        if (curr.type !== CellType.COIN) {
          if (acc.hiddenCoins.length !== 0 || acc.notHiddenCoins.length !== 0) {
            acc.result = acc.result
              .concat(acc.notHiddenCoins)
              .concat(acc.hiddenCoins);
            acc.hiddenCoins = [];
            acc.notHiddenCoins = [];
          }
          if (curr.type !== CellType.COIN_DIVIDER || isAnySmallBalance) {
            acc.result.push(curr);
          }
        } else {
          if (hiddenCoins.includes(curr.uid)) {
            acc.hiddenCoins.push(curr);
          } else {
            acc.notHiddenCoins.push(curr);
          }
        }
        return acc;
      },
      { hiddenCoins: [], notHiddenCoins: [], result: [] } as {
        result: BaseCellSuccinctType[];
        hiddenCoins: BaseCellSuccinctType[];
        notHiddenCoins: BaseCellSuccinctType[];
      }
    );
    return briefSectionsDataFilteredSorted;
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
