/* eslint-disable react/display-name */
/* eslint-disable sort-keys */
import { get } from 'lodash';
import React from 'react';
import {
  CoinDivider,
  CoinDividerHeight,
  SmallBalancesWrapper,
} from '../coin-divider';
import { CoinRowHeight } from '../coin-row';
import { FloatingActionButton } from '../fab';
import {
  InvestmentCard,
  InvestmentCardHeader,
  UniswapInvestmentCard,
} from '../investment-cards';
import { ListFooter } from '../list';
import SavingsListWrapper from '../savings/SavingsListWrapper';
import { TokenFamilyHeader } from '../token-family';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';

const firstCoinRowMarginTop = 6;
let lastRenderList = [];

export const ViewTypes = {
  HEADER: {
    calculateHeight: ({ hideHeader }) =>
      hideHeader ? 0 : AssetListHeader.height,
    index: 0,
    renderComponent: ({ data, isCoinListEdited }) => {
      return <AssetListHeader {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_ROW: {
    calculateHeight: ({ isFirst, isLast, areSmallCollectibles }) =>
      CoinRowHeight +
      (isFirst ? firstCoinRowMarginTop : 0) +
      (isLast && !areSmallCollectibles ? ListFooter.height + 1 : 0),
    index: 1,
    renderComponent: ({ type, data }) => {
      const { item = {}, renderItem } = data;
      return renderItem({
        firstCoinRowMarginTop: firstCoinRowMarginTop,
        isFirstCoinRow: type.isFirst,
        item,
      });
    },
    visibleDuringCoinEdit: true,
  },

  COIN_DIVIDER: {
    calculateHeight: () => CoinDividerHeight,
    index: 2,
    renderComponent: ({ data, isCoinListEdited, nativeCurrency }) => {
      const { item = {} } = data;
      return (
        <CoinDivider
          assetsAmount={item.assetsAmount}
          balancesSum={item.value}
          isCoinListEdited={isCoinListEdited}
          nativeCurrency={nativeCurrency}
        />
      );
    },
    visibleDuringCoinEdit: true,
  },
  COIN_SMALL_BALANCES: {
    calculateHeight: ({ isOpen, smallBalancesLength, isCoinListEdited }) =>
      isOpen
        ? smallBalancesLength * CoinRowHeight +
          15 +
          (isCoinListEdited ? 100 : 0)
        : 13,
    index: 3,
    renderComponent: ({ data, smallBalancedChanged }) => {
      const { item = {}, renderItem } = data;

      if (
        lastRenderList.length !== item.assets.length ||
        smallBalancedChanged
      ) {
        smallBalancedChanged = false;
        const renderList = [];
        for (let i = 0; i < item.assets.length; i++) {
          renderList.push(
            renderItem({
              item: {
                ...item.assets[i],
                isSmall: true,
              },
              key: `CoinSmallBalances${i}`,
            })
          );
        }
        lastRenderList = renderList;
      }
      return <SmallBalancesWrapper assets={lastRenderList} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SAVINGS: {
    calculateHeight: ({ isOpen, amountOfRows }) => {
      const TokenFamilyHeaderHeight = TokenFamilyHeader.height;

      return isOpen
        ? TokenFamilyHeaderHeight + ListFooter.height + 61 * amountOfRows - 4
        : TokenFamilyHeaderHeight + ListFooter.height - 10;
    },
    index: 4,
    renderComponent: ({ data }) => {
      const { item = {} } = data;
      return (
        <SavingsListWrapper assets={item.assets} totalValue={item.totalValue} />
      );
    },
  },

  UNISWAP_ROW: {
    calculateHeight: ({ isLast, isOpen }) =>
      (isOpen ? UniswapInvestmentCard.height : InvestmentCardHeader.height) +
      InvestmentCard.margin.vertical +
      (isLast ? ListFooter.height + 8 : 0),
    index: 5,
    renderComponent: ({ type, data }) => {
      const { item = {}, renderItem } = data;
      return renderItem({ isFirstCoinRow: type.isFirst, item });
    },
  },

  UNIQUE_TOKEN_ROW: {
    calculateHeight: ({ amountOfRows, isFirst, isHeader, isOpen }) => {
      const TokenFamilyHeaderHeight = isHeader ? TokenFamilyHeader.height : 0;
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
    index: 6,
    renderComponent: ({ type, data, index, sections }) => {
      const { item = {}, renderItem } = data;
      return renderItem({
        childrenAmount: item.childrenAmount,
        familyId: item.familyId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        isFirst: type.isFirst,
        isHeader: type.isHeader,
        item: item.tokens,
        shouldPrioritizeImageLoading:
          index < get(sections, '[0].data.length', 0) + 9,
        uniqueId: item.uniqueId,
      });
    },
  },

  FOOTER: {
    calculateHeight: ({ paddingBottom }) =>
      paddingBottom - FloatingActionButton.size / 2,
    index: 7,
  },
  UNKNOWN: {
    calculateHeight: () => 0,
    index: 99,
  },
};
