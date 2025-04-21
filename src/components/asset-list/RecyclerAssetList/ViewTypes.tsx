import React from 'react';
import { CoinDivider, CoinDividerHeight, SmallBalancesWrapper } from '@/components/coin-divider';
import { CoinRowHeight } from '@/components/coin-row';
import { FloatingActionButtonSize } from '@/components/fab';
import { Header } from '@/components/showcase/ShowcaseHeader';
import { TokenFamilyHeaderHeight } from '@/components/token-family';
import AssetListHeader, { AssetListHeaderHeight } from '@/components/asset-list/AssetListHeader';
import { ListFooterHeight } from '@/components/list/ListFooter';
import { RecyclerAssetListSection } from '.';
import { CardSize, UniqueTokenCardMargin } from '@/components/unique-token/CardSize';

export const firstCoinRowMarginTop = 6;
const lastCoinRowAdditionalHeight = 1;

const openSmallBalancesAdditionalHeight = 15;
const closedSmallBalancesAdditionalHeight = 18;

const firstUniqueTokenMarginTop = 4;
const extraSpaceForDropShadow = 19;

const amountOfImagesWithForcedPrioritizeLoading = 9;
const editModeAdditionalHeight = 100;

interface ViewTypeBase {
  index: number;
  visibleDuringCoinEdit: boolean;
}

interface HeaderViewType extends ViewTypeBase {
  calculateHeight: (props: { hideHeader?: boolean }) => number;
  renderComponent: (props: { data: any; isCoinListEdited?: boolean }) => JSX.Element;
}

interface ShowcaseHeaderProps {
  data: any;
}

interface ShowcaseHeaderViewType extends ViewTypeBase {
  calculateHeight: () => number;
  renderComponent: (props: ShowcaseHeaderProps) => JSX.Element;
}

interface CoinRowViewType extends ViewTypeBase {
  calculateHeight: (props: { isFirst: boolean; isLast: boolean; areSmallCollectibles: boolean | undefined }) => number;
  renderComponent: (props: { type: { isFirst: boolean }; data: { item: any; renderItem: (props: any) => JSX.Element } }) => JSX.Element;
}

interface CoinDividerItem {
  value: string;
  defaultToEditButton: boolean;
  extendedState: any;
}

interface CoinDividerViewType extends ViewTypeBase {
  calculateHeight: () => number;
  renderComponent: (props: { data: { item: CoinDividerItem } }) => JSX.Element;
}

interface Asset {
  isSmall?: boolean;
  [key: string]: any;
}

interface CoinSmallBalancesItem {
  assets: Asset[];
}

interface CoinSmallBalancesViewType extends ViewTypeBase {
  calculateHeight: (props: { isOpen: boolean; smallBalancesLength: number; isCoinListEdited: boolean }) => number;
  renderComponent: (props: { data: { item: CoinSmallBalancesItem; renderItem: (props: any) => JSX.Element } }) => JSX.Element;
}

interface UniqueTokenItem {
  childrenAmount: number;
  familyId: string;
  familyImage: string | null;
  familyName: string;
  tokens: any[];
  uniqueId: string;
}

interface UniqueTokenRowViewType extends ViewTypeBase {
  calculateHeight: (props: { amountOfRows: number; isFirst: boolean; isHeader: boolean; isOpen: boolean }) => number;
  renderComponent: (props: {
    type: { isFirst: boolean; isHeader: boolean };
    data: { item: UniqueTokenItem; renderItem: (props: any) => JSX.Element };
    index: number;
    sections: readonly RecyclerAssetListSection[];
  }) => JSX.Element;
}

interface FooterViewType extends ViewTypeBase {
  calculateHeight: (props: { paddingBottom: number }) => number;
}

interface UnknownViewType extends ViewTypeBase {
  calculateHeight: () => number;
}

export const ViewTypes: {
  HEADER: HeaderViewType;
  SHOWCASE_HEADER: ShowcaseHeaderViewType;
  COIN_ROW: CoinRowViewType;
  COIN_DIVIDER: CoinDividerViewType;
  COIN_SMALL_BALANCES: CoinSmallBalancesViewType;
  UNIQUE_TOKEN_ROW: UniqueTokenRowViewType;
  FOOTER: FooterViewType;
  UNKNOWN: UnknownViewType;
} = {
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
    renderComponent: ({ data }: ShowcaseHeaderProps) => {
      return <Header {...data} />;
    },
    visibleDuringCoinEdit: true,
  },

  COIN_ROW: {
    calculateHeight: ({ isFirst, isLast, areSmallCollectibles }) =>
      CoinRowHeight +
      (isFirst ? firstCoinRowMarginTop : 0) +
      (!isFirst && isLast && !areSmallCollectibles ? ListFooterHeight + lastCoinRowAdditionalHeight : 0),
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
      const { item = { value: '', defaultToEditButton: false, extendedState: null } } = data;
      return <CoinDivider balancesSum={item.value} defaultToEditButton={item.defaultToEditButton} extendedState={item.extendedState} />;
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
      const { item = { assets: [] }, renderItem } = data;
      const renderList: React.ReactNode[] = [];
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
      const heightOfRows = amountOfRows * CardSize;
      const heightOfRowMargins = UniqueTokenCardMargin * (amountOfRows - 1);
      const height =
        SectionHeaderHeight + firstRowExtraTopPadding + (isOpen ? heightOfRows + heightOfRowMargins + extraSpaceForDropShadow : 0);
      return height;
    },
    index: 4,
    renderComponent: ({ type, data, index, sections }) => {
      const {
        item = {
          childrenAmount: 0,
          familyId: '',
          familyImage: null,
          familyName: '',
          tokens: [],
          uniqueId: '',
        },
        renderItem,
      } = data;
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
