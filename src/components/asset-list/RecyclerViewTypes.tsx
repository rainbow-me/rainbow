/* eslint-disable sort-keys-fix/sort-keys-fix */
import { get } from 'lodash';
import React from 'react';
import {
  CoinDivider,
  CoinDividerHeight,
  SmallBalancesWrapper,
} from '../coin-divider';
import { CoinRowHeight } from '../coin-row';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../coin-row/SavingsCoinRow' was resolved t... Remove this comment to see the full error message
import { SavingsCoinRowHeight } from '../coin-row/SavingsCoinRow';
import { FloatingActionButtonSize } from '../fab';
import { ListFooter } from '../list';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../pools/PoolsListWrapper' was resolved to... Remove this comment to see the full error message
import PoolsListWrapper from '../pools/PoolsListWrapper';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../savings/SavingsListWrapper' was resolve... Remove this comment to see the full error message
import SavingsListWrapper from '../savings/SavingsListWrapper';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../showcase/ShowcaseHeader' was resolved t... Remove this comment to see the full error message
import { Header } from '../showcase/ShowcaseHeader';
import { TokenFamilyHeaderHeight } from '../token-family';
import { UniqueTokenRow } from '../unique-token';
// @ts-expect-error ts-migrate(6142) FIXME: Module './AssetListHeader' was resolved to '/Users... Remove this comment to see the full error message
import AssetListHeader, { AssetListHeaderHeight } from './AssetListHeader';

export const firstCoinRowMarginTop = 6;
const lastCoinRowAdditionalHeight = 1;

const openSmallBalancesAdditionalHeight = 15;
const closedSmallBalancesAdditionalHeight = 18;

const savingsOpenAdditionalHeight = -7.5;
const savingsClosedAdditionalHeight = -5;
const savingsLastOpenAdditionalHeight = -13;
const savingsLastClosedAdditionalHeight = -10;

const poolsOpenAdditionalHeight = -12;
const poolsClosedAdditionalHeight = -15;
const poolsLastOpenAdditionalHeight = -14;
const poolsLastClosedAdditionalHeight = -10.5;

const firstUniqueTokenMarginTop = 4;
const extraSpaceForDropShadow = 19;

const amountOfImagesWithForcedPrioritizeLoading = 9;
const editModeAdditionalHeight = 100;

export const ViewTypes = {
  HEADER: {
    calculateHeight: ({ hideHeader = false }) =>
      hideHeader ? 0 : AssetListHeaderHeight,
    index: 0,
    renderComponent: ({ data, isCoinListEdited }: any) => {
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <AssetListHeader {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: true,
  },

  SHOWCASE_HEADER: {
    calculateHeight: () => 380,
    index: 8,
    renderComponent: (data: any) => {
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <Header {...data} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_ROW: {
    calculateHeight: ({ isFirst, isLast, areSmallCollectibles }: any) =>
      CoinRowHeight +
      (isFirst ? firstCoinRowMarginTop : 0) +
      (!isFirst && isLast && !areSmallCollectibles
        ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
          ListFooter.height + lastCoinRowAdditionalHeight
        : 0),
    index: 1,
    renderComponent: ({ type, data }: any) => {
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
    renderComponent: ({ data }: any) => {
      const { item = {} } = data;
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <CoinDivider balancesSum={item.value} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SMALL_BALANCES: {
    calculateHeight: ({ isOpen, smallBalancesLength, isCoinListEdited }: any) =>
      smallBalancesLength > 0
        ? isOpen
          ? smallBalancesLength * CoinRowHeight +
            openSmallBalancesAdditionalHeight +
            (isCoinListEdited ? editModeAdditionalHeight : 0)
          : closedSmallBalancesAdditionalHeight
        : 0,
    index: 3,
    renderComponent: ({ data }: any) => {
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
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <SmallBalancesWrapper assets={renderList} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_SAVINGS: {
    calculateHeight: ({ isOpen, isLast, amountOfRows }: any) =>
      isOpen
        ? TokenFamilyHeaderHeight +
          (isLast
            ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
              ListFooter.height + savingsLastOpenAdditionalHeight
            : savingsOpenAdditionalHeight) +
          SavingsCoinRowHeight * amountOfRows
        : TokenFamilyHeaderHeight +
          (isLast
            ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
              ListFooter.height + savingsLastClosedAdditionalHeight
            : savingsClosedAdditionalHeight),
    index: 4,
    renderComponent: ({ data }: any) => {
      const { item = {} } = data;
      return (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <SavingsListWrapper assets={item.assets} totalValue={item.totalValue} />
      );
    },
    visibleDuringCoinEdit: false,
  },

  POOLS: {
    calculateHeight: ({ isOpen, isLast, amountOfRows }: any) =>
      isOpen
        ? TokenFamilyHeaderHeight +
          (isLast
            ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
              ListFooter.height + poolsLastOpenAdditionalHeight
            : poolsOpenAdditionalHeight) +
          CoinRowHeight * amountOfRows
        : TokenFamilyHeaderHeight +
          (isLast
            ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'height' does not exist on type 'MemoExot... Remove this comment to see the full error message
              ListFooter.height + poolsLastClosedAdditionalHeight
            : poolsClosedAdditionalHeight),
    index: 5,
    renderComponent: ({ data, isCoinListEdited }: any) => {
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      return <PoolsListWrapper {...data} isCoinListEdited={isCoinListEdited} />;
    },
    visibleDuringCoinEdit: false,
  },

  UNIQUE_TOKEN_ROW: {
    calculateHeight: ({ amountOfRows, isFirst, isHeader, isOpen }: any) => {
      const SectionHeaderHeight = isHeader ? TokenFamilyHeaderHeight : 0;
      const firstRowExtraTopPadding = isFirst ? firstUniqueTokenMarginTop : 0;
      const heightOfRows = amountOfRows * UniqueTokenRow.cardSize;
      const heightOfRowMargins = UniqueTokenRow.cardMargin * (amountOfRows - 1);
      const height =
        SectionHeaderHeight +
        firstRowExtraTopPadding +
        (isOpen
          ? heightOfRows + heightOfRowMargins + extraSpaceForDropShadow
          : 0);
      return height;
    },
    index: 6,
    renderComponent: ({ type, data, index, sections }: any) => {
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
          index <
          get(sections, '[0].data.length', 0) +
            amountOfImagesWithForcedPrioritizeLoading,
        uniqueId: item.uniqueId,
      });
    },
    visibleDuringCoinEdit: false,
  },

  FOOTER: {
    calculateHeight: ({ paddingBottom }: any) =>
      paddingBottom - FloatingActionButtonSize / 2,
    index: 7,
    visibleDuringCoinEdit: false,
  },
  UNKNOWN: {
    calculateHeight: () => 0,
    index: 99,
    visibleDuringCoinEdit: false,
  },
};
