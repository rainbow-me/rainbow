import { findIndex, get, has, isNil } from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { LayoutAnimation, RefreshControl, View } from 'react-native';
import { compose, pure } from 'recompact';
import {
  BaseItemAnimator,
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import {
  withFabSelection,
  withOpenBalances,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
} from '../../hoc';
import { colors } from '../../styles';
import {
  deviceUtils,
  isNewValueForPath,
  safeAreaInsetValues,
} from '../../utils';
import { CoinDivider, SmallBalancesWrapper } from '../coin-divider';
import { CoinRow } from '../coin-row';
import { TokenFamilyHeader } from '../token-family';
import { FloatingActionButton } from '../fab';
import {
  InvestmentCard,
  UniswapInvestmentCard,
  InvestmentCardHeader,
} from '../investment-cards';
import { ListFooter } from '../list';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';
import { TokenFamilyWrapPaddingTop } from '../token-family/TokenFamilyWrap';

/* eslint-disable sort-keys */
export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1,
  COIN_ROW_LAST: 2,
  COIN_SMALL_BALANCES: 3,
  FOOTER: 11,
  UNIQUE_TOKEN_ROW: 4,
  UNIQUE_TOKEN_ROW_CLOSED: 5,
  UNIQUE_TOKEN_ROW_CLOSED_LAST: 6,
  UNIQUE_TOKEN_ROW_FIRST: 8, // TODO remove
  UNIQUE_TOKEN_ROW_LAST: 9, // TODO remove
  UNISWAP_ROW: 7,
  UNISWAP_ROW_CLOSED: 9,
  UNISWAP_ROW_CLOSED_LAST: 10,
  UNISWAP_ROW_LAST: 8,
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

const reloadHeightOffsetTop = -60;
const reloadHeightOffsetBottom = -62;
let smallBalancedChanged = false;

const AssetListHeaderRenderer = pure(data => <AssetListHeader {...data} />);

const hasRowChanged = (r1, r2) => {
  const isNewShowShitcoinsValue = isNewValueForPath(r1, r2, 'showShitcoins');
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

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

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
    r1.item.smallBalancesContainer &&
    r2.item.smallBalancesContainer
  ) {
    if (r1.item.assets.length !== r2.item.assets.length) {
      smallBalancedChanged = true;
    } else if (r2.item.assets.length > 0) {
      for (let i = 0; i < r2.item.assets.length; i++) {
        if (r1.item.assets[i].native) {
          if (
            r1.item.assets[i].native.balance.display !==
            r2.item.assets[i].native.balance.display
          ) {
            smallBalancedChanged = true;
          }
        }
      }
    }
  }

  return (
    isNewAsset ||
    isNewAssetBalance ||
    isNewShowShitcoinsValue ||
    isNewTitle ||
    isNewTokenFamilyId ||
    isNewTokenFamilyName ||
    isNewTokenFamilySize ||
    isNewTotalItems ||
    isNewTotalValue ||
    isNewUniswapPercentageOwned ||
    isNewUniswapToken
  );
};

class RecyclerAssetList extends Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    openFamilyTabs: PropTypes.object,
    openInvestmentCards: PropTypes.object,
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
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const { openFamilyTabs, openInvestmentCards, sections } = this.props;

        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return ViewTypes.HEADER;
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
          if (index === lastBalanceIndex) {
            if (
              sections[balancesIndex].data[lastBalanceIndex - 1]
                .smallBalancesContainer
            ) {
              return ViewTypes.COIN_SMALL_BALANCES;
            }
            return ViewTypes.COIN_ROW_LAST;
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
            if (openFamilyTabs[familyIndex]) {
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
        if (type.get === ViewTypes.UNIQUE_TOKEN_ROW) {
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
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = areSmallCollectibles
            ? CoinRow.height
            : CoinRow.height + ListFooter.height + 1;
        } else if (type === ViewTypes.COIN_SMALL_BALANCES) {
          const balancesIndex = findIndex(
            sections,
            ({ name }) => name === 'balances'
          );
          const size =
            sections[balancesIndex].data[
              sections[balancesIndex].data.length - 1
            ].assets.length;
          dim.height = openSmallBalances
            ? CoinDivider.height + size * CoinRow.height + ListFooter.height + 9
            : CoinDivider.height + ListFooter.height + 16;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
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
    const items = sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
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
    };
  }

  componentDidMount = () => {
    this.isCancelled = false;
  };

  componentDidUpdate(prevProps) {
    const {
      openFamilyTabs,
      openInvestmentCards,
      openSmallBalances,
      scrollingVelocity,
      sections,
    } = this.props;

    let balances = {};
    let collectibles = {};
    let investments = {};

    sections.forEach(section => {
      if (section.balances) {
        balances = section;
      } else if (section.collectibles) {
        collectibles = section;
      } else if (section.investments) {
        investments = section;
      }
    });

    if (scrollingVelocity === 0) {
      clearInterval(this.interval);
    }

    if (
      scrollingVelocity &&
      scrollingVelocity !== prevProps.scrollingVelocity
    ) {
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.rlv.scrollToOffset(0, this.position + scrollingVelocity * 10);
      }, 30);
    }

    if (openFamilyTabs !== prevProps.openFamilyTabs && collectibles.data) {
      let i = 0;
      while (i < collectibles.data.length) {
        if (openFamilyTabs[i] === true && !prevProps.openFamilyTabs[i]) {
          let collectiblesHeight = 0;
          for (let j = 0; j < i; j++) {
            if (openFamilyTabs[j] && collectibles.data[j].tokens) {
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
              balances.data[balances.data.length - 1].smallBalancesContainer
            ) {
              balancesHeight += CoinDivider.height + ListFooter.height + 9;
              if (openSmallBalances) {
                balancesHeight +=
                  CoinRow.height *
                  balances.data[balances.data.length - 1].assets.length;
              }
            } else {
              balancesHeight += CoinDivider.height + ListFooter.height + 16;
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
          openFamilyTabs[i] === false &&
          prevProps.openFamilyTabs[i] === true
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
      (openSmallBalances === false && prevProps.openSmallBalances === true)
    ) {
      let balancesHeight = 0;
      if (balances.data) {
        balancesHeight += CoinRow.height * (balances.data.length - 1);
        if (balances.data[balances.data.length - 1].smallBalancesContainer) {
          balancesHeight += CoinDivider.height + ListFooter.height;
          if (openSmallBalances) {
            balancesHeight +=
              CoinRow.height *
              balances.data[balances.data.length - 1].assets.length;
          }
        } else {
          balancesHeight += CoinRow.height + ListFooter.height;
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
          if (openFamilyTabs[j] && collectibles.data[j].tokens) {
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
      const renderSize =
        balancesHeight +
        investmentHeight +
        collectiblesHeight +
        ListFooter.height;
      const deviceDimensions =
        deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 240 : 360);
      if (
        this.position + deviceDimensions > renderSize &&
        renderSize > deviceDimensions
      ) {
        layoutItemAnimator.animateShift = () =>
          LayoutAnimation.configureNext(
            LayoutAnimation.create(310, 'easeInEaseOut', 'opacity')
          );
        this.scrollToOffset(renderSize - deviceDimensions, true);
        setTimeout(() => {
          layoutItemAnimator.animateShift = () =>
            LayoutAnimation.configureNext(
              LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
            );
        }, 300);
      }
    }
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
    clearInterval(this.interval);
  };

  rlv = React.createRef();

  contentSize = 0;

  layoutMeasurement = 0;

  position = 0;

  renderList = [];

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
      (contentSize.height - layoutMeasurement.height >= offsetY &&
        offsetY >= 0) ||
      (offsetY < reloadHeightOffsetTop && offsetY > reloadHeightOffsetBottom)
    ) {
      if (this.props.scrollViewTracker) {
        this.props.scrollViewTracker.setValue(offsetY);
      }
    }
  };

  renderRefreshControl = () => (
    <RefreshControl
      onRefresh={this.handleRefresh}
      refreshing={this.state.isRefreshing}
      tintColor={colors.alpha(colors.blueGreyLight, 0.666)}
    />
  );

  rowRenderer = (type, data, index) => {
    if (isNil(data) || isNil(index)) {
      return null;
    }

    const { item = {}, renderItem } = data;
    const { hideHeader, sections } = this.props;

    if (type === ViewTypes.HEADER) {
      return hideHeader ? null : <AssetListHeaderRenderer {...data} />;
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
              key: `CoinSmallBalances${i}`,
            })
          );
        }
        this.renderList = renderList;
      }

      return <SmallBalancesWrapper assets={this.renderList} />;
    }

    const isNotUniqueToken =
      type === ViewTypes.COIN_ROW ||
      type === ViewTypes.COIN_ROW_LAST ||
      type === ViewTypes.UNISWAP_ROW ||
      type === ViewTypes.UNISWAP_ROW_LAST ||
      type === ViewTypes.UNISWAP_ROW_CLOSED ||
      type === ViewTypes.UNISWAP_ROW_CLOSED_LAST ||
      type === ViewTypes.FOOTER;

    // TODO sections
    return isNotUniqueToken
      ? renderItem({ item })
      : renderItem({
          childrenAmount: item.childrenAmount,
          familyId: item.familyId,
          familyImage: item.familyImage,
          familyName: item.familyName,
          item: item.tokens,
          paddingTop: type.isFirst ? 4 : 0,
          shouldPrioritizeImageLoading:
            index < get(sections, '[0].data.length', 0) + 9,
          uniqueId: item.uniqueId,
        });
  };

  render() {
    const {
      externalScrollView,
      fetchData,
      hideHeader,
      renderAheadOffset,
    } = this.props;
    const { dataProvider, headersIndices } = this.state;

    return (
      <View backgroundColor={colors.white} flex={1} overflow="hidden">
        <StickyContainer stickyHeaderIndices={headersIndices}>
          <RecyclerListView
            dataProvider={dataProvider}
            extendedState={{ headersIndices }}
            itemAnimator={layoutItemAnimator}
            externalScrollView={externalScrollView}
            layoutProvider={this.layoutProvider}
            onScroll={this.handleScroll}
            ref={this.handleListRef}
            renderAheadOffset={renderAheadOffset}
            disableRecycling
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
            }}
          />
        </StickyContainer>
      </View>
    );
  }
}

export default compose(
  withFabSelection,
  withOpenFamilyTabs,
  withOpenInvestmentCards,
  withOpenBalances
)(RecyclerAssetList);
