import React from 'react';
import { CoinDivider, CoinDividerHeight, SmallBalancesWrapper } from '../coin-divider';
import { CoinRowHeight } from '../coin-row';
import { FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
import { Header } from '../showcase/ShowcaseHeader';
import { TokenFamilyHeaderHeight } from '../token-family';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader, { AssetListHeaderHeight } from './AssetListHeader';

export const firstCoinRowMarginTop = 6;
const lastCoinRowAdditionalHeight = 1;

const openSmallBalancesAdditionalHeight = 15;
const closedSmallBalancesAdditionalHeight = 18;

const firstUniqueTokenMarginTop = 4;
const extraSpaceForDropShadow = 19;

const amountOfImagesWithForcedPrioritizeLoading = 9;
const editModeAdditionalHeight = 100;

export const ViewTypes = {
  HEADER: {
    calculateHeight: ({ hideHeader = false }) => (hideHeader ? 0 : AssetListHeaderHeight),
    index: 0,
    renderComponent: ({ data, isCoinListEdited }) => {
      return <AssetListHeader {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: true,
  },

  SHOWCASE_HEADER: {
    calculateHeight: () => 380,
    index: 6,
    renderComponent: data => {
      return <Header {...data} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_ROW: {
    calculateHeight: ({ isFirst, isLast, areSmallCollectibles }) =>
      CoinRowHeight +
      (isFirst ? firstCoinRowMarginTop : 0) +
      (!isFirst && isLast && !areSmallCollectibles ? ListFooter.height + lastCoinRowAdditionalHeight : 0),
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
    renderComponent: ({ data }) => {
      const { item = {} } = data;
      return <CoinDivider balancesSum={item.value} defaultToEditButton={item.defaultToEditButton} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SMALL_BALANCES: {
    calculateHeight: ({ isOpen, smallBalancesLength, isCoinListEdited }) =>
      smallBalancesLength > 0
        ? isOpen
          ? smallBalancesLength * CoinRowHeight + openSmallBalancesAdditionalHeight + (isCoinListEdited ? editModeAdditionalHeight : 0)
          : closedSmallBalancesAdditionalHeight
        : 0,
    index: 3,
    renderComponent: ({ data }) => {
      const { item = {}, renderItem } = data;
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
      // TODO: moize the renderList
      return <SmallBalancesWrapper assets={renderList} />;
    },
    visibleDuringCoinEdit: true,
  },

  UNIQUE_TOKEN_ROW: {
    calculateHeight: ({ amountOfRows, isFirst, isHeader, isOpen }) => {
      const SectionHeaderHeight = isHeader ? TokenFamilyHeaderHeight : 0;
      const firstRowExtraTopPadding = isFirst ? firstUniqueTokenMarginTop : 0;
      const heightOfRows = amountOfRows * UniqueTokenRow.cardSize;
      const heightOfRowMargins = UniqueTokenRow.cardMargin * (amountOfRows - 1);
      const height =
        SectionHeaderHeight + firstRowExtraTopPadding + (isOpen ? heightOfRows + heightOfRowMargins + extraSpaceForDropShadow : 0);
      return height;
    },
    index: 4,
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
        shouldPrioritizeImageLoading: index < (sections?.[0]?.data?.length ?? 0) + amountOfImagesWithForcedPrioritizeLoading,
        uniqueId: item.uniqueId,
      });
    },
    visibleDuringCoinEdit: false,
  },

  FOOTER: {
    calculateHeight: ({ paddingBottom }) => paddingBottom - FloatingActionButtonSize / 2,
    index: 5,
    visibleDuringCoinEdit: false,
  },
  UNKNOWN: {
    calculateHeight: () => 0,
    index: 99,
    visibleDuringCoinEdit: false,
  },
};
