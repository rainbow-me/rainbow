/* eslint-disable sort-keys */
import { CoinRow } from '../coin-row';
import { FloatingActionButton } from '../fab';
import {
  InvestmentCard,
  InvestmentCardHeader,
  UniswapInvestmentCard,
} from '../investment-cards';
import { ListFooter } from '../list';
import { TokenFamilyHeader } from '../token-family';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';

const firstCoinRowMarginTop = 6;

export const ViewTypes = {
  HEADER: {
    calculateHeight: ({ hideHeader }) =>
      hideHeader ? 0 : AssetListHeader.height,
    index: 0,
  },

  COIN_ROW_FIRST: {
    calculateHeight: () => CoinRow.height + firstCoinRowMarginTop,
    index: 2,
  },
  COIN_ROW: {
    calculateHeight: () => CoinRow.height,
    index: 3,
  },
  COIN_ROW_LAST: {
    calculateHeight: areSmallCollectibles =>
      areSmallCollectibles
        ? CoinRow.height
        : CoinRow.height + ListFooter.height + 1,
    index: 4,
  },

  COIN_SMALL_BALANCES: {
    calculateHeight: ({ isOpen, smallBalancesLength, isCoinListEdited }) =>
      isOpen
        ? smallBalancesLength * CoinRow.height +
          15 +
          (isCoinListEdited ? 100 : 0)
        : 13,
    index: 5,
  },
  COIN_DIVIDER: {
    calculateHeight: () => CoinRow.height,
    index: 6,
  },

  COIN_SAVINGS: {
    calculateHeight: ({ isOpen, amountOfRows, isLast, paddingBottom }) => {
      const fabPositionBottom = isLast
        ? paddingBottom - FloatingActionButton.size / 2
        : 0;
      const TokenFamilyHeaderHeight =
        TokenFamilyHeader.height + fabPositionBottom;

      return isOpen
        ? TokenFamilyHeaderHeight + ListFooter.height + 61 * amountOfRows - 4
        : TokenFamilyHeaderHeight + ListFooter.height - 10;
    },
    index: 7,
  },

  UNISWAP_ROW: {
    calculateHeight: ({ isLast, isOpen }) =>
      (isOpen ? UniswapInvestmentCard.height : InvestmentCardHeader.height) +
      InvestmentCard.margin.vertical +
      (isLast ? ListFooter.height + 8 : 0),
    index: 8,
  },

  UNIQUE_TOKEN_ROW: {
    calculateHeight: ({
      amountOfRows,
      isFirst,
      isLast,
      isOpen,
      paddingBottom,
    }) => {
      const fabPositionBottom = isLast
        ? paddingBottom - FloatingActionButton.size / 2
        : 0;
      const TokenFamilyHeaderHeight =
        TokenFamilyHeader.height + fabPositionBottom;
      const firstRowExtraTopPadding = isFirst ? 4 : 0;
      const heightOfRows = amountOfRows * UniqueTokenRow.cardSize;
      const heightOfRowMargins = UniqueTokenRow.cardMargin * (amountOfRows - 1);
      const extraSpaceForDropShadow = 19;

      const height =
        TokenFamilyHeaderHeight +
        firstRowExtraTopPadding +
        (isOpen
          ? heightOfRows + heightOfRowMargins + extraSpaceForDropShadow
          : 0);
      return height;
    },
    index: 10,
  },

  FOOTER: {
    calculateHeight: () => 0,
    index: 12,
  },
  UNKNOWN: {
    calculateHeight: () => 0,
    index: 99,
  },
};
