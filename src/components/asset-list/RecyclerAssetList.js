import { findIndex, get, has, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component, Fragment } from 'react';
import { LayoutAnimation, RefreshControl, View } from 'react-native';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { compose, pure } from 'recompact';
import {
  BaseItemAnimator,
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import {
  withAccountSettings,
  withCoinListEdited,
  withFabSelection,
  withOpenBalances,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenSavings,
} from '../../hoc';
import { colors } from '../../styles';
import {
  deviceUtils,
  isNewValueForPath,
  safeAreaInsetValues,
} from '../../utils';
import { CoinDivider, SmallBalancesWrapper } from '../coin-divider';
import { CoinRow } from '../coin-row';
import { FloatingActionButton } from '../fab';
import {
  InvestmentCard,
  InvestmentCardHeader,
  UniswapInvestmentCard,
} from '../investment-cards';
import { ListFooter } from '../list';
import SavingsListWrapper from '../savings/SavingsListWrapper';
import { TokenFamilyHeader } from '../token-family';
import { TokenFamilyWrapPaddingTop } from '../token-family/TokenFamilyWrap';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';

/* eslint-disable sort-keys */
export const ViewTypes = {
  HEADER: 0,
  HEADER_FIRST: 1,
  COIN_ROW_FIRST: 2,
  COIN_ROW: 3,
  COIN_ROW_LAST: 4,
  COIN_SMALL_BALANCES: 5,
  COIN_DIVIDER: 6,
  COIN_SAVINGS: 7,
  UNISWAP_ROW: 8,
  UNISWAP_ROW_LAST: 9,
  UNISWAP_ROW_CLOSED: 10,
  UNISWAP_ROW_CLOSED_LAST: 11,
  UNIQUE_TOKEN_ROW: 12,
  UNIQUE_TOKEN_ROW_CLOSED: 13,
  UNIQUE_TOKEN_ROW_CLOSED_LAST: 14,
  FOOTER: 15,
};
/* eslint-enable sort-keys */

const NOOP = () => undefined;

class LayoutItemAnimator extends BaseItemAnimator {
  animateDidMount = NOOP;
  animateShift = () =>
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        initialVelocity: 0,
        springDamping: 1,
        type: LayoutAnimation.Types.spring,
      },
    });
  animateWillMount = NOOP;
  animateWillUnmount = NOOP;
  animateWillUpdate = NOOP;
}

const layoutItemAnimator = new LayoutItemAnimator();

const firstCoinRowMarginTop = 6;
const reloadHeightOffsetTop = -60;
const reloadHeightOffsetBottom = -62;
let smallBalancedChanged = false;
let smallBalancesIndex = 0;
let savingsIndex = 0;

const AssetListHeaderRenderer = pure(data => <AssetListHeader {...data} />);

const hasRowChanged = (r1, r2) => {
  const isNewTitle = isNewValueForPath(r1, r2, 'title');
  const isNewTotalItems = isNewValueForPath(r1, r2, 'totalItems');
  const isNewTotalValue = isNewValueForPath(r1, r2, 'totalValue');
  const isNewAsset = isNewValueForPath(r1, r2, 'item.uniqueId');
  const isNewTokenFamilyId = isNewValueForPath(r1, r2, 'item.familyId');
  const isNewTokenFamilyName = isNewValueForPath(r1, r2, 'item.familyName');
  const isNewTokenFamilySize = isNewValueForPath(r1, r2, 'item.childrenAmount');
  const isNewUniswapPercentageOwned = isNewValueForPath(
    r1,
    r2,
    'item.percentageOwned'
  );
  const isNewUniswapToken = isNewValueForPath(r1, r2, 'item.tokenSymbol');
  const isPinned = isNewValueForPath(r1, r2, 'item.isPinned');

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  let savingsSectionChanged = false;
  if (
    r1.item &&
    r2.item &&
    r1.item.assets &&
    r2.item.assets &&
    r1.item.savingsContainer &&
    r2.item.savingsContainer
  ) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      savingsSectionChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].supplyRate) {
          if (r1.item.assets[i].supplyRate !== r2.item.assets[i].supplyRate) {
            savingsSectionChanged = true;
          }
        } else if (r1.item.assets[i].supplyBalanceUnderlying) {
          if (
            r1.item.assets[i].supplyBalanceUnderlying !==
            r2.item.assets[i].supplyBalanceUnderlying
          ) {
            savingsSectionChanged = true;
          }
        }
      }
    }
  }

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(
      r1,
      r2,
      'item.native.balance.display'
    );
  }

  if (
    r1.item &&
    r2.item &&
    r1.item.assets &&
    r2.item.assets &&
    r1.item.smallBalancesContainer &&
    r2.item.smallBalancesContainer
  ) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      smallBalancedChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].native && r2.item.assets[i].native) {
          if (
            get(r1.item.assets[i].native, 'balance.display', null) !==
              get(r2.item.assets[i].native, 'balance.display', null) ||
            r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden
          ) {
            smallBalancedChanged = true;
          }
        } else if (r1.item.assets[i].isHidden !== r2.item.assets[i].isHidden) {
          smallBalancedChanged = true;
        }
      }
    }
  }

  return (
    isNewAsset ||
    isNewAssetBalance ||
    isNewTitle ||
    isNewTokenFamilyId ||
    isNewTokenFamilyName ||
    isNewTokenFamilySize ||
    isNewTotalItems ||
    isNewTotalValue ||
    isNewUniswapPercentageOwned ||
    isNewUniswapToken ||
    isPinned ||
    savingsSectionChanged ||
    smallBalancedChanged
  );
};

class RecyclerAssetList extends Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    nativeCurrency: PropTypes.string,
    openFamilyTabs: PropTypes.object,
    openInvestmentCards: PropTypes.object,
    openSavings: PropTypes.bool,
    openSmallBalances: PropTypes.bool,
    paddingBottom: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    scrollingVelocity: PropTypes.number,
    scrollViewTracker: PropTypes.object,
    sections: PropTypes.arrayOf(
      PropTypes.shape({
        balances: PropTypes.bool,
        collectibles: PropTypes.bool,
        data: PropTypes.array.isRequired,
        header: PropTypes.shape({
          title: PropTypes.string,
          totalItems: PropTypes.number,
          totalValue: PropTypes.string,
        }),
        investments: PropTypes.bool,
        perData: PropTypes.object,
        renderItem: PropTypes.func.isRequired,
        type: PropTypes.string,
      })
    ),
  };

  static defaultProps = {
    renderAheadOffset: deviceUtils.dimensions.height,
  };

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
      isRefreshing: false,
      itemsCount: 0,
      showCoinListEditor: false,
      stickyComponentsIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const { openFamilyTabs, openInvestmentCards, sections } = this.props;

        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return index === 0 ? ViewTypes.HEADER_FIRST : ViewTypes.HEADER;
        }

        if (index === this.state.itemsCount - 1) {
          return ViewTypes.FOOTER;
        }

        const balancesIndex = findIndex(
          sections,
          ({ name }) => name === 'balances'
        );
        const collectiblesIndex = findIndex(
          sections,
          ({ name }) => name === 'collectibles'
        );
        const investmentsIndex = findIndex(
          sections,
          ({ name }) => name === 'investments'
        );

        if (balancesIndex > -1) {
          const balanceItemsCount = get(
            sections,
            `[${balancesIndex}].data.length`,
            0
          );
          const lastBalanceIndex =
            headersIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex - 2) {
            if (this.coinDividerIndex !== index) {
              this.coinDividerIndex = index;
              if (this.props.isCoinListEdited) {
                this.checkEditStickyHeader();
              }
            }
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              return ViewTypes.COIN_DIVIDER;
            }
          }
          if (index === lastBalanceIndex - 1) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 2]
                .smallBalancesContainer
            ) {
              smallBalancesIndex = index - 1;
              return ViewTypes.COIN_SMALL_BALANCES;
            }
          }
          if (index === lastBalanceIndex) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 1]
                .smallBalancesContainer
            ) {
              smallBalancesIndex = index - 1;
              return ViewTypes.COIN_SMALL_BALANCES;
            } else if (
              sections[balancesIndex].data[lastBalanceIndex - 1]
                .savingsContainer
            ) {
              savingsIndex = index - 1;
              return ViewTypes.COIN_SAVINGS;
            }
            this.lastAssetIndex = index;
            return ViewTypes.COIN_ROW_LAST;
          }
          const firstBalanceIndex = headersIndices[balancesIndex] + 1;
          if (
            index === firstBalanceIndex &&
            !sections[balancesIndex].data[firstBalanceIndex - 1]
              .smallBalancesContainer
          ) {
            return ViewTypes.COIN_ROW_FIRST;
          }
        }

        if (investmentsIndex > -1) {
          const investmentItemsCount = get(
            sections,
            `[${investmentsIndex}].data.length`,
            0
          );
          const lastInvestmentIndex =
            headersIndices[investmentsIndex] + investmentItemsCount;

          if (
            index > headersIndices[investmentsIndex] &&
            index <= lastInvestmentIndex
          ) {
            if (
              !openInvestmentCards[
                sections[investmentsIndex].data[
                  index - headersIndices[investmentsIndex] - 1
                ].uniqueId
              ]
            ) {
              return index === lastInvestmentIndex
                ? ViewTypes.UNISWAP_ROW_LAST
                : ViewTypes.UNISWAP_ROW;
            }
            return index === lastInvestmentIndex
              ? ViewTypes.UNISWAP_ROW_CLOSED_LAST
              : ViewTypes.UNISWAP_ROW_CLOSED;
          }
        }

        if (collectiblesIndex > -1) {
          if (index > headersIndices[collectiblesIndex]) {
            const familyIndex = index - headersIndices[collectiblesIndex] - 1;
            if (
              openFamilyTabs[
                sections[collectiblesIndex].data[familyIndex].familyName
              ]
            ) {
              if (
                get(
                  sections,
                  `[${collectiblesIndex}].data[${familyIndex}].tokens`
                )
              ) {
                return {
                  get: ViewTypes.UNIQUE_TOKEN_ROW,
                  isFirst: index === headersIndices[collectiblesIndex] + 1,
                  isLast: index === this.state.itemsCount - 2,
                  rowCount: get(
                    sections,
                    `[${collectiblesIndex}].data[${familyIndex}].tokens`,
                    []
                  ).length,
                };
              }
            }
            return {
              get: ViewTypes.UNIQUE_TOKEN_ROW_CLOSED,
              isFirst: index === headersIndices[collectiblesIndex] + 1,
              isLast: index === this.state.itemsCount - 2,
            };
          }
        }

        return ViewTypes.COIN_ROW;
      },
      (type, dim) => {
        const {
          hideHeader,
          openSavings,
          openSmallBalances,
          paddingBottom,
          sections,
        } = this.props;

        const { areSmallCollectibles } = this.state;

        dim.width = deviceUtils.dimensions.width;

        if (areSmallCollectibles && type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = CoinRow.height;
          return;
        }

        const fabPositionBottom = type.isLast
          ? paddingBottom - FloatingActionButton.size / 2
          : 0;
        const TokenFamilyHeaderHeight =
          TokenFamilyHeader.height + fabPositionBottom;

        const firstRowExtraTopPadding = type.isFirst ? 4 : 0;
        if (type === ViewTypes.COIN_ROW_FIRST) {
          dim.height = CoinRow.height + firstCoinRowMarginTop;
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = areSmallCollectibles
            ? CoinRow.height
            : CoinRow.height + ListFooter.height + 1;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
        } else if (type === ViewTypes.COIN_DIVIDER) {
          dim.height = CoinDivider.height;
        } else if (type === ViewTypes.COIN_SMALL_BALANCES) {
          const balancesIndex = findIndex(
            sections,
            ({ name }) => name === 'balances'
          );
          const additionalHeight =
            savingsIndex < smallBalancesIndex ? ListFooter.height : 0;
          const size =
            sections[balancesIndex].data[smallBalancesIndex].assets.length;
          dim.height = openSmallBalances
            ? size * CoinRow.height +
              additionalHeight +
              15 +
              (this.props.isCoinListEdited ? 100 : 0)
            : additionalHeight + 13;
        } else if (type === ViewTypes.HEADER_FIRST) {
          dim.height = hideHeader ? 0 : AssetListHeader.height;
        } else if (this.props.isCoinListEdited) {
          dim.height = 0;
        } else if (type.get === ViewTypes.UNIQUE_TOKEN_ROW) {
          const heightOfRows = type.rowCount * UniqueTokenRow.cardSize;
          const heightOfRowMargins =
            UniqueTokenRow.cardMargin * (type.rowCount - 1);
          const extraSpaceForDropShadow = 19;
          dim.height =
            TokenFamilyHeaderHeight +
            heightOfRows +
            heightOfRowMargins +
            firstRowExtraTopPadding +
            extraSpaceForDropShadow;
        } else if (type.get === ViewTypes.UNIQUE_TOKEN_ROW_CLOSED) {
          dim.height = TokenFamilyHeaderHeight + firstRowExtraTopPadding;
        } else if (type === ViewTypes.COIN_SAVINGS) {
          const balancesIndex = findIndex(
            sections,
            ({ name }) => name === 'balances'
          );
          dim.height = openSavings
            ? TokenFamilyHeaderHeight +
              ListFooter.height +
              61 * sections[balancesIndex].data[savingsIndex].assets.length -
              4
            : TokenFamilyHeaderHeight + ListFooter.height - 10;
        } else if (type === ViewTypes.UNISWAP_ROW_LAST) {
          dim.height =
            UniswapInvestmentCard.height +
            InvestmentCard.margin.vertical +
            ListFooter.height +
            8;
        } else if (type === ViewTypes.UNISWAP_ROW) {
          dim.height =
            UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
        } else if (type === ViewTypes.UNISWAP_ROW_CLOSED_LAST) {
          dim.height =
            InvestmentCardHeader.height +
            InvestmentCard.margin.vertical +
            ListFooter.height +
            8;
        } else if (type === ViewTypes.UNISWAP_ROW_CLOSED) {
          dim.height =
            InvestmentCardHeader.height + InvestmentCard.margin.vertical;
        } else if (type === ViewTypes.HEADER) {
          dim.height = hideHeader ? 0 : AssetListHeader.height;
        } else if (type === ViewTypes.FOOTER) {
          dim.height = 0;
        }
      }
    );
  }

  static getDerivedStateFromProps({ sections }, state) {
    const headersIndices = [];
    const stickyComponentsIndices = [];
    const items = sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
      stickyComponentsIndices.push(ctx.length);
      return ctx
        .concat([
          {
            isHeader: true,
            ...section.header,
          },
        ])
        .concat(
          section.data.map(item => ({
            item: { ...item, ...section.perData },
            renderItem: section.renderItem,
          }))
        );
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => null });
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(
      sections.find(e => e.collectibles)
    );
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      itemsCount: items.length,
      stickyComponentsIndices,
    };
  }

  componentDidMount = () => {
    this.isCancelled = false;
  };

  componentDidUpdate(prevProps) {
    const {
      openFamilyTabs,
      openInvestmentCards,
      openSavings,
      openSmallBalances,
      scrollingVelocity,
      sections,
    } = this.props;

    let balances = {};
    let collectibles = {};
    let investments = {};
    let prevCollectibles = {};

    sections.forEach(section => {
      if (section.balances) {
        balances = section;
      } else if (section.collectibles) {
        collectibles = section;
      } else if (section.investments) {
        investments = section;
      }
    });

    prevProps.sections.forEach(section => {
      if (section.collectibles) {
        prevCollectibles = section;
      }
    });

    if (scrollingVelocity === 0) {
      clearTimeout(this.scrollHandle);
    }

    if (
      scrollingVelocity &&
      scrollingVelocity !== prevProps.scrollingVelocity
    ) {
      this.startScroll(scrollingVelocity);
    }

    if (
      collectibles.data &&
      prevCollectibles.data &&
      collectibles.data[0].familyName === 'Showcase' &&
      (collectibles.data[0].childrenAmount !==
        prevCollectibles.data[0].childrenAmount ||
        prevCollectibles.data[0].familyName !== 'Showcase')
    ) {
      let investmentHeight = 0;
      if (investments.data) {
        investmentHeight += AssetListHeader.height;
        for (let k = 0; k < investments.data.length; k++) {
          if (!openInvestmentCards[investments.data[k].uniqueId]) {
            investmentHeight +=
              UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
          } else {
            investmentHeight +=
              InvestmentCardHeader.height + InvestmentCard.margin.vertical;
          }
        }
        investmentHeight += ListFooter.height + 8;
      }
      let balancesHeight = 0;
      if (balances.data) {
        balancesHeight += AssetListHeader.height;

        if (
          balances.data[balances.data.length - 1].smallBalancesContainer ||
          (balances.data[balances.data.length - 2] &&
            balances.data[balances.data.length - 2].smallBalancesContainer)
        ) {
          balancesHeight +=
            CoinDivider.height +
            (balances.data[balances.data.length - 1].smallBalancesContainer
              ? 4
              : 20);
          if (openSmallBalances) {
            balancesHeight +=
              CoinRow.height *
              balances.data[
                balances.data.length -
                  (balances.data[balances.data.length - 1]
                    .smallBalancesContainer
                    ? 1
                    : 2)
              ].assets.length;
          }
        }

        if (balances.data[balances.data.length - 1].savingsContainer) {
          balancesHeight += openSavings
            ? TokenFamilyHeader.height +
              61 * balances.data[savingsIndex].assets.length -
              4
            : TokenFamilyHeader.height - 10;
        }

        balancesHeight +=
          ListFooter.height + CoinRow.height * (balances.data.length - 1);
      }

      this.scrollToOffset(
        balancesHeight + investmentHeight - AssetListHeader.height,
        true
      );
    }

    if (openFamilyTabs !== prevProps.openFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (
          openFamilyTabs[collectibles.data[i].familyName] === true &&
          !prevProps.openFamilyTabs[collectibles.data[i].familyName]
        ) {
          let collectiblesHeight = 0;
          for (let j = 0; j < i; j++) {
            if (
              openFamilyTabs[collectibles.data[j].familyName] &&
              collectibles.data[j].tokens
            ) {
              collectiblesHeight +=
                TokenFamilyHeader.height +
                collectibles.data[j].tokens.length * UniqueTokenRow.height +
                TokenFamilyWrapPaddingTop -
                2;
            } else {
              collectiblesHeight += TokenFamilyHeader.height;
            }
          }
          let investmentHeight = 0;
          if (investments.data) {
            for (let k = 0; k < investments.data.length; k++) {
              if (!openInvestmentCards[investments.data[k].uniqueId]) {
                investmentHeight +=
                  UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
              } else {
                investmentHeight +=
                  InvestmentCardHeader.height + InvestmentCard.margin.vertical;
              }
            }
          }
          let balancesHeight = 0;
          if (balances.data) {
            balancesHeight += CoinRow.height * (balances.data.length - 1);
            if (
              balances.data[balances.data.length - 1].smallBalancesContainer ||
              (balances.data[balances.data.length - 2] &&
                balances.data[balances.data.length - 2].smallBalancesContainer)
            ) {
              balancesHeight += balances.data[balances.data.length - 1]
                .smallBalancesContainer
                ? ListFooter.height + 4
                : 20;
              if (openSmallBalances) {
                balancesHeight +=
                  CoinRow.height *
                  balances.data[
                    balances.data.length -
                      (balances.data[balances.data.length - 1]
                        .smallBalancesContainer
                        ? 1
                        : 2)
                  ].assets.length;
              }
            }
            if (balances.data[balances.data.length - 1].savingsContainer) {
              if (openSavings) {
                balancesHeight +=
                  61 * balances.data[balances.data.length - 1].assets.length -
                  1;
              } else {
                balancesHeight -= ListFooter.height;
              }
            }
          }
          const verticalOffset = 10;
          const deviceDimensions =
            deviceUtils.dimensions.height -
            (deviceUtils.isSmallPhone ? 210 : 235);
          const sectionBeforeCollectibles =
            AssetListHeader.height * (sections.length - 1) +
            ListFooter.height * (sections.length - 1) +
            balancesHeight +
            investmentHeight;
          const sectionsHeight = sectionBeforeCollectibles + collectiblesHeight;
          const renderSize =
            collectibles.data[i].tokens.length * UniqueTokenRow.height +
            TokenFamilyWrapPaddingTop;

          if (renderSize >= deviceDimensions) {
            const scrollDistance = sectionsHeight - this.position;
            this.scrollToOffset(
              this.position + scrollDistance - verticalOffset,
              true
            );
          } else {
            const diff = this.position - sectionsHeight + deviceDimensions;
            if (renderSize > diff) {
              const scrollDistance = renderSize - diff;
              this.scrollToOffset(this.position + scrollDistance, true);
            }
          }
          break;
        }
        i++;
      }
    }

    let shouldAutoscrollBack = false;
    if (collectibles.data) {
      for (let i = 0; i < collectibles.data.length; i++) {
        if (
          openFamilyTabs[collectibles.data[i].familyName] === false &&
          prevProps.openFamilyTabs[collectibles.data[i].familyName] === true
        ) {
          shouldAutoscrollBack = true;
          break;
        }
      }
    }

    if (investments.data && !shouldAutoscrollBack) {
      for (let i = 0; i < investments.data.length; i++) {
        if (
          openInvestmentCards[investments.data[i].uniqueId] === true &&
          prevProps.openInvestmentCards[investments.data[i].uniqueId] === false
        ) {
          shouldAutoscrollBack = true;
          break;
        }
      }
    }

    if (
      shouldAutoscrollBack ||
      (openSmallBalances === false && prevProps.openSmallBalances === true) ||
      (openSavings === false && prevProps.openSavings === true)
    ) {
      let balancesHeight = 0;
      if (balances.data) {
        balancesHeight += CoinRow.height * (balances.data.length - 1);
        if (
          balances.data[balances.data.length - 1].smallBalancesContainer ||
          (balances.data[balances.data.length - 2] &&
            balances.data[balances.data.length - 2].smallBalancesContainer)
        ) {
          balancesHeight += balances.data[balances.data.length - 1]
            .smallBalancesContainer
            ? ListFooter.height + 4
            : 20;
          if (openSmallBalances) {
            balancesHeight +=
              CoinRow.height *
              balances.data[
                balances.data.length -
                  (balances.data[balances.data.length - 1]
                    .smallBalancesContainer
                    ? 1
                    : 2)
              ].assets.length;
          }
        }
        if (balances.data[balances.data.length - 1].savingsContainer) {
          if (openSavings) {
            balancesHeight +=
              61 * balances.data[balances.data.length - 1].assets.length - 1;
          } else {
            balancesHeight -= ListFooter.height;
          }
        }
      }

      let investmentHeight = 0;
      if (investments.data) {
        for (let k = 0; k < investments.data.length; k++) {
          if (!openInvestmentCards[investments.data[k].uniqueId]) {
            investmentHeight +=
              UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
          } else {
            investmentHeight +=
              InvestmentCardHeader.height + InvestmentCard.margin.vertical;
          }
        }
      }

      let collectiblesHeight = 0;
      if (collectibles.data) {
        collectiblesHeight =
          collectibles.data.length > 0 ? AssetListHeader.height : 0;
        for (let j = 0; j < collectibles.data.length; j++) {
          if (
            openFamilyTabs[collectibles.data[j].familyName] &&
            collectibles.data[j].tokens
          ) {
            collectiblesHeight +=
              TokenFamilyHeader.height +
              collectibles.data[j].tokens.length * UniqueTokenRow.height +
              TokenFamilyWrapPaddingTop -
              2;
          } else {
            collectiblesHeight += TokenFamilyHeader.height;
          }
        }
      }
      const renderSize = balancesHeight + investmentHeight + collectiblesHeight;
      const deviceDimensions =
        deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 240 : 360);
      if (
        this.position + deviceDimensions - 20 > renderSize &&
        renderSize > deviceDimensions
      ) {
        layoutItemAnimator.animateShift = () =>
          LayoutAnimation.configureNext({
            duration: 250,
            update: {
              delay: 10,
              type: 'easeInEaseOut',
            },
          });
        setTimeout(() => {
          this.rlv.scrollToEnd({ animated: true });
        }, 10);
        setTimeout(() => {
          layoutItemAnimator.animateShift = () =>
            LayoutAnimation.configureNext({
              duration: 200,
              update: {
                initialVelocity: 0,
                springDamping: 1,
                type: LayoutAnimation.Types.spring,
              },
            });
        }, 250);
      }
    }
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
    clearTimeout(this.scrollHandle);
  };

  rlv = React.createRef();

  contentSize = 0;

  layoutMeasurement = 0;

  position = 0;

  renderList = [];
  savingsList = [];
  savingsSumValue = 0;

  checkEditStickyHeader = () => {
    const offsetHeight = CoinRow.height * (this.coinDividerIndex - 1) + 5;
    if (this.props.isCoinListEdited && this.position > offsetHeight) {
      this.setState({ showCoinListEditor: true });
    } else if (
      (this.position < offsetHeight || !this.props.isCoinListEdited) &&
      this.state.showCoinListEditor === true
    ) {
      this.setState({ showCoinListEditor: false });
    }
  };

  startScroll = scrollingVelocity => {
    clearTimeout(this.scrollHandle);
    this.rlv.scrollToOffset(0, this.position + scrollingVelocity * 10);
    this.scrollHandle = setTimeout(this.startScroll, 30);
  };

  scrollToOffset = (position, animated) => {
    setTimeout(() => {
      this.rlv.scrollToOffset(0, position, animated);
    }, 5);
  };

  getStableId = index => {
    const { dataProvider } = this.state;
    const row = get(dataProvider, `_data[${index}]`);

    if (row.isHeader) {
      return `header_${row.title}`;
    }

    if (row.item && row.item.address) {
      return `balance_${row.item.address}`;
    }

    if (row.item && row.item.uniqueId) {
      return `investment_${row.item.uniqueId}`;
    }

    if (row.item && row.item.familyName) {
      return `family_${row.item.familyName}`;
    }

    if (row.item && row.item.smallBalancesContainer) {
      return `balance_${row.item.stableId}`;
    }

    if (row.item && row.item.coinDivider) {
      return `coinDivider`;
    }

    if (row.item && row.item.savingsContainer) {
      return `savingsContainer`;
    }

    if (index === dataProvider._data.length - 1) {
      return 'footer';
    }

    return index;
  };

  handleListRef = ref => {
    this.rlv = ref;
  };

  handleRefresh = () => {
    if (this.state.isRefreshing) return;

    this.setState({ isRefreshing: true }, () => {
      this.props
        .fetchData()
        .then(() => {
          if (!this.isCancelled) {
            this.setState({ isRefreshing: false });
          }
        })
        .catch(() => {
          if (!this.isCancelled) {
            this.setState({ isRefreshing: false });
          }
        });
    });
  };

  handleScroll = ({ nativeEvent }, _, offsetY) => {
    const { contentSize, layoutMeasurement } = nativeEvent;

    this.position = offsetY;

    if (this.contentSize !== contentSize.height) {
      this.contentSize = contentSize.height;
    }

    if (this.layoutMeasurement !== layoutMeasurement.height) {
      this.layoutMeasurement = layoutMeasurement.height;
    }

    if (
      ((contentSize.height - layoutMeasurement.height >= offsetY &&
        offsetY >= 0) ||
        (offsetY < reloadHeightOffsetTop &&
          offsetY > reloadHeightOffsetBottom)) &&
      this.props.scrollViewTracker
    ) {
      this.props.scrollViewTracker.setValue(offsetY);
    }

    if (this.props.isCoinListEdited) {
      this.checkEditStickyHeader();
    }
  };

  renderRefreshControl = () => (
    <RefreshControl
      onRefresh={this.handleRefresh}
      refreshing={this.state.isRefreshing}
      tintColor={colors.alpha(colors.blueGreyDark, 0.4)}
    />
  );

  rowRenderer = (type, data, index) => {
    if (isNil(data) || isNil(index)) {
      return null;
    }

    const { item = {}, renderItem } = data;
    const { hideHeader, sections, isCoinListEdited } = this.props;

    if (isCoinListEdited && !(type < 7)) {
      return null;
    }

    if (type === ViewTypes.HEADER || type === ViewTypes.HEADER_FIRST) {
      return hideHeader ? null : (
        <AssetListHeaderRenderer
          {...data}
          isCoinListEdited={this.props.isCoinListEdited}
        />
      );
    }

    if (type === ViewTypes.COIN_SAVINGS) {
      return (
        <SavingsListWrapper assets={item.assets} totalValue={item.totalValue} />
      );
    }

    if (type === ViewTypes.COIN_SMALL_BALANCES) {
      if (
        this.renderList.length !== item.assets.length ||
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
              key: `CoinSmallBalances${item.assets[i].symbol}`,
            })
          );
        }
        this.renderList = renderList;
      }

      return <SmallBalancesWrapper assets={this.renderList} />;
    }

    if (type === ViewTypes.COIN_DIVIDER) {
      return (
        <CoinDivider
          assetsAmount={item.assetsAmount}
          balancesSum={item.value}
          isCoinListEdited={isCoinListEdited}
          nativeCurrency={this.props.nativeCurrency}
        />
      );
    }

    const isNotUniqueToken =
      type === ViewTypes.COIN_ROW ||
      type === ViewTypes.COIN_ROW_FIRST ||
      type === ViewTypes.COIN_ROW_LAST ||
      type === ViewTypes.UNISWAP_ROW ||
      type === ViewTypes.UNISWAP_ROW_LAST ||
      type === ViewTypes.UNISWAP_ROW_CLOSED ||
      type === ViewTypes.UNISWAP_ROW_CLOSED_LAST ||
      type === ViewTypes.FOOTER;

    const isFirstCoinRow = type === ViewTypes.COIN_ROW_FIRST;

    // TODO sections
    return isNotUniqueToken
      ? renderItem({ isFirstCoinRow, item })
      : renderItem({
          childrenAmount: item.childrenAmount,
          familyId: item.familyId,
          familyImage: item.familyImage,
          familyName: item.familyName,
          isFirst: type.isFirst,
          item: item.tokens,
          shouldPrioritizeImageLoading:
            index < get(sections, '[0].data.length', 0) + 9,
          uniqueId: item.uniqueId,
        });
  };

  stickyRowRenderer = (_, data) => (
    <Fragment>
      <AssetListHeaderRenderer {...data} isSticky />
      {this.state.showCoinListEditor ? (
        <CoinDivider
          assetsAmount={this.renderList.length}
          balancesSum={0}
          isSticky
          nativeCurrency={this.props.nativeCurrency}
          onEndEdit={() => {
            this.setState({ showCoinListEditor: false });
          }}
        />
      ) : null}
    </Fragment>
  );

  render() {
    const {
      externalScrollView,
      fetchData,
      hideHeader,
      renderAheadOffset,
      isCoinListEdited,
    } = this.props;
    const {
      dataProvider,
      headersIndices,
      stickyComponentsIndices,
    } = this.state;

    return (
      <View backgroundColor={colors.white} flex={1} overflow="hidden">
        <PanGestureHandler enabled={isCoinListEdited}>
          <StickyContainer
            overrideRowRenderer={this.stickyRowRenderer}
            stickyHeaderIndices={
              isCoinListEdited ? [0] : stickyComponentsIndices
            }
          >
            <RecyclerListView
              dataProvider={dataProvider}
              disableRecycling
              extendedState={{ headersIndices }}
              externalScrollView={externalScrollView}
              itemAnimator={layoutItemAnimator}
              layoutProvider={this.layoutProvider}
              onScroll={this.handleScroll}
              ref={this.handleListRef}
              renderAheadOffset={renderAheadOffset}
              rowRenderer={this.rowRenderer}
              scrollIndicatorInsets={{
                bottom: safeAreaInsetValues.bottom,
                top: hideHeader ? 0 : AssetListHeader.height,
              }}
              scrollViewProps={{
                refreshControl: fetchData && this.renderRefreshControl(),
              }}
              style={{
                backgroundColor: colors.white,
                flex: 1,
                minHeight: 1,
              }}
            />
          </StickyContainer>
        </PanGestureHandler>
      </View>
    );
  }
}

export default compose(
  withCoinListEdited,
  withFabSelection,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenBalances,
  withOpenSavings,
  withAccountSettings
)(RecyclerAssetList);
