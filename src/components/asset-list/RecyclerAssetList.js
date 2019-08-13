import {
  findIndex,
  get,
  has,
  isNil,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { LayoutAnimation, RefreshControl, View } from 'react-native';
import { compose, pure } from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import {
  buildAssetHeaderUniqueIdentifier,
  buildAssetUniqueIdentifier,
} from '../../helpers/assets';
import { withFabSelection, withOpenFamilyTabs } from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils, isNewValueForPath, safeAreaInsetValues } from '../../utils';
import { CoinRow } from '../coin-row';
import { TokenFamilyHeader } from '../token-family';
import { FloatingActionButton } from '../fab';
import { InvestmentCard, UniswapInvestmentCard } from '../investment-cards';
import { ListFooter } from '../list';
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';
import { TokenFamilyWrapPaddingTop } from '../token-family/TokenFamilyWrap';

/* eslint-disable sort-keys */
export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1,
  COIN_ROW_LAST: 2,
  UNIQUE_TOKEN_ROW: 3,
  UNIQUE_TOKEN_ROW_CLOSED: 4,
  UNIQUE_TOKEN_ROW_CLOSED_LAST: 5,
  UNISWAP_ROW: 6,
  UNISWAP_ROW_LAST: 7,
  FOOTER: 10,
};
/* eslint-enable sort-keys */

const NOOP = () => undefined;

const layoutItemAnimator = {
  animateDidMount: NOOP,
  animateShift: () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')),
  animateWillMount: NOOP,
  animateWillUnmount: NOOP,
  animateWillUpdate: NOOP,
};

// eslint-disable-next-line react/prop-types
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
  const isNewUniswapPercentageOwned = isNewValueForPath(r1, r2, 'item.percentageOwned');
  const isNewUniswapToken = isNewValueForPath(r1, r2, 'item.tokenSymbol');

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(r1, r2, 'item.native.balance.display');
  }

  return isNewAsset
    || isNewAssetBalance
    || isNewShowShitcoinsValue
    || isNewTitle
    || isNewTokenFamilyId
    || isNewTokenFamilyName
    || isNewTokenFamilySize
    || isNewTotalItems
    || isNewTotalValue
    || isNewUniswapPercentageOwned
    || isNewUniswapToken;
};

class RecyclerAssetList extends Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    openFamilyTabs: PropTypes.array,
    paddingBottom: PropTypes.number,
    renderAheadOffset: PropTypes.number,
    scrollingVelocity: PropTypes.number,
    scrollViewTracker: PropTypes.object,
    sections: PropTypes.arrayOf(PropTypes.shape({
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
    })),
  };

  static defaultProps = {
    renderAheadOffset: deviceUtils.dimensions.height,
  };

  rlv = React.createRef();

  contentSize = 0;

  layoutMeasurement = 0;

  position = 0;

  refresh = false;

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
        const { openFamilyTabs, sections } = this.props;
        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }

        if (index === this.state.itemsCount - 1) {
          return ViewTypes.FOOTER;
        }

        const balancesIndex = findIndex(sections, ({ name }) => name === 'balances');
        const collectiblesIndex = findIndex(sections, ({ name }) => name === 'collectibles');
        const investmentsIndex = findIndex(sections, ({ name }) => name === 'investments');

        if (balancesIndex > -1) {
          const balanceItemsCount = get(sections, `[${balancesIndex}].data.length`, 0);
          const lastBalanceIndex = headersIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex) {
            return ViewTypes.COIN_ROW_LAST;
          }
        }

        if (investmentsIndex > -1) {
          const investmentItemsCount = get(sections, `[${investmentsIndex}].data.length`, 0);
          const lastInvestmentIndex = headersIndices[investmentsIndex] + investmentItemsCount;

          if ((index > headersIndices[investmentsIndex]) && (index <= lastInvestmentIndex)) {
            return index === lastInvestmentIndex
              ? ViewTypes.UNISWAP_ROW_LAST
              : ViewTypes.UNISWAP_ROW;
          }
        }

        if (collectiblesIndex > -1) {
          if (index > headersIndices[collectiblesIndex]) {
            const familyIndex = index - headersIndices[collectiblesIndex] - 1;
            if (openFamilyTabs[familyIndex]) {
              if (get(sections, `[${collectiblesIndex}].data[${familyIndex}].tokens`)) {
                return {
                  get: ViewTypes.UNIQUE_TOKEN_ROW,
                  isFirst: index === headersIndices[collectiblesIndex] + 1,
                  isLast: index === this.state.itemsCount - 2,
                  rowCount: get(sections, `[${collectiblesIndex}].data[${familyIndex}].tokens`, []).length,
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
        const { hideHeader, paddingBottom } = this.props;
        const { areSmallCollectibles } = this.state;

        dim.width = deviceUtils.dimensions.width;

        if (areSmallCollectibles && type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = CoinRow.height;
          return;
        }

        const fabPositionBottom = type.isLast ? (paddingBottom - (FloatingActionButton.size / 2)) : 0;
        const TokenFamilyHeaderHeight = TokenFamilyHeader.height + fabPositionBottom;

        const firstRowExtraTopPadding = type.isFirst ? 4 : 0;
        if (type.get === ViewTypes.UNIQUE_TOKEN_ROW) {
          const heightOfRows = type.rowCount * UniqueTokenRow.cardSize;
          const heightOfRowMargins = UniqueTokenRow.cardMargin * (type.rowCount - 1);
          const extraSpaceForDropShadow = 19;
          dim.height = (
            TokenFamilyHeaderHeight
            + heightOfRows
            + heightOfRowMargins
            + firstRowExtraTopPadding
            + extraSpaceForDropShadow
          );
        } else if (type.get === ViewTypes.UNIQUE_TOKEN_ROW_CLOSED) {
          dim.height = TokenFamilyHeaderHeight + firstRowExtraTopPadding;
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = areSmallCollectibles ? CoinRow.height : CoinRow.height + ListFooter.height - 1;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
        } else if (type === ViewTypes.UNISWAP_ROW_LAST) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical + ListFooter.height + 7;
        } else if (type === ViewTypes.UNISWAP_ROW) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
        } else if (type === ViewTypes.HEADER) {
          dim.height = hideHeader ? 0 : AssetListHeader.height;
        } else if (type === ViewTypes.FOOTER) {
          dim.height = 0;
        }
      },
    );
  }

  static getDerivedStateFromProps({ sections }, state) {
    const headersIndices = [];
    const items = sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
      return ctx
        .concat([{
          isHeader: true,
          ...section.header,
        }])
        .concat(section.data.map(item => ({ item: { ...item, ...section.perData }, renderItem: section.renderItem })));
    }, []);
    items.push({ item: { isLastPlaceholder: true }, renderItem: () => NOOP });
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(sections.find(e => e.collectibles));
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      itemsCount: items.length,
    };
  }

  shouldComponentUpdate = (nextProps, nextState) => {
    if (nextProps.openFamilyTabs !== this.props.openFamilyTabs) {
      return true;
    }

    if (nextState.isRefreshing !== this.state.isRefreshing) {
      return true;
    }

    if (this.contentSize - this.layoutMeasurement < this.position && this.position !== 0 && this.position !== 60.5) {
      return false;
    }

    return true;
  }

  componentDidMount = () => {
    this.isCancelled = false;
  };

  componentDidUpdate(prev) {
    let balances = {};
    let collectibles = {};
    let investments = {};
    this.props.sections.forEach(section => {
      if (section.balances) {
        balances = section;
      } else if (section.collectibles) {
        collectibles = section;
      } else if (section.investments) {
        investments = section;
      }
    });
    if (this.props.scrollingVelocity === 0) {
      clearInterval(this.interval);
    }
    if (this.props.scrollingVelocity && this.props.scrollingVelocity !== prev.scrollingVelocity) {
      clearInterval(this.interval);
      this.interval = setInterval(() => {
        this.rlv.scrollToOffset(0, this.position + this.props.scrollingVelocity * 10);
      }, 30);
    }
    if (this.props.openFamilyTabs !== prev.openFamilyTabs) {
      let i = 0;
      while (i < this.props.openFamilyTabs.length) {
        if (this.props.openFamilyTabs[i] === true && prev.openFamilyTabs[i] === false) {
          let collectiblesHeight = 0;
          for (let j = 0; j < i; j++) {
            if (this.props.openFamilyTabs[j] && collectibles.data[j].tokens) {
              collectiblesHeight += TokenFamilyHeader.height + collectibles.data[j].tokens.length * UniqueTokenRow.height + TokenFamilyWrapPaddingTop - 2;
            } else {
              collectiblesHeight += TokenFamilyHeader.height;
            }
          }
          const verticalOffset = 17.5;
          const deviceDimensions = deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 200 : 225);
          const sectionBeforeCollectibles = (AssetListHeader.height * (this.props.sections.length - 1)
            + ListFooter.height * (this.props.sections.length - 1) + CoinRow.height * get(balances, 'data.length', 0)
            + (UniswapInvestmentCard.height + InvestmentCard.margin.vertical) * get(investments, 'data.length', 0) + ListFooter.height);
          const sectionsHeight = sectionBeforeCollectibles + collectiblesHeight;
          const renderSize = collectibles.data[i].tokens.length * UniqueTokenRow.height + TokenFamilyWrapPaddingTop;

          if (renderSize >= deviceDimensions) {
            const scrollDistance = sectionsHeight - this.position;
            this.scrollToOffset(this.position + scrollDistance - verticalOffset, true);
          } else {
            const diff = this.position - sectionsHeight + deviceDimensions;
            if (renderSize > diff) {
              const scrollDistance = renderSize - diff;
              this.scrollToOffset(this.position + scrollDistance, true);
            }
          }
          break;
        }
        if (this.props.openFamilyTabs[i] === false && prev.openFamilyTabs[i] === true) {
          const balancesHeight = AssetListHeader.height + CoinRow.height * get(balances, 'data.length', 0);
          const investmentHeight = (AssetListHeader.height + (UniswapInvestmentCard.height
            + InvestmentCard.margin.vertical) * get(investments, 'data.length', 0));
          let collectiblesHeight = collectibles.data.length > 0 ? AssetListHeader.height : 0;
          for (let j = 0; j < collectibles.data.length; j++) {
            if (this.props.openFamilyTabs[j] && collectibles.data[j].tokens) {
              collectiblesHeight += TokenFamilyHeader.height + collectibles.data[j].tokens.length * UniqueTokenRow.height + TokenFamilyWrapPaddingTop - 2;
            } else {
              collectiblesHeight += TokenFamilyHeader.height;
            }
          }
          const renderSize = balancesHeight + investmentHeight + collectiblesHeight + ListFooter.height;
          const deviceDimensions = deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 160 : 280);
          if (this.position + deviceDimensions > renderSize) {
            layoutItemAnimator.animateShift = () => LayoutAnimation.configureNext(LayoutAnimation.create(310, 'easeInEaseOut', 'opacity'));
            this.scrollToOffset(renderSize - deviceDimensions, true);
            setTimeout(() => {
              layoutItemAnimator.animateShift = () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity'));
            }, 300);
          }
        }
        i++;
      }
    }
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
    clearInterval(this.interval);
  };

  scrollToOffset = (position, animated) => {
    setTimeout(() => {
      this.rlv.scrollToOffset(0, position, animated);
    }, 5);
  }

  getStableId = (index) => {
    const row = get(this.state, `dataProvider._data[${index}]`);
    if (get(row, 'item.isLastPlaceholder', false)) {
      return 'isLastPlaceholder';
    }

    return has(row, 'isHeader')
      ? buildAssetHeaderUniqueIdentifier(row)
      : buildAssetUniqueIdentifier(row.item);
  };

  handleListRef = (ref) => { this.rlv = ref; }

  handleRefresh = () => {
    if (this.state.isRefreshing) return;

    this.setState({ isRefreshing: true }, () => {
      this.props.fetchData().then(() => {
        if (!this.isCancelled) {
          this.setState({ isRefreshing: false });
        }
      }).catch(error => {
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

    if ((contentSize.height - layoutMeasurement.height >= offsetY && offsetY >= 0)
      || (offsetY < -60 && offsetY > -62)) {
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
      return NOOP;
    }

    const { item = {}, renderItem } = data;
    const { hideHeader, sections } = this.props;

    if (type === ViewTypes.HEADER) {
      return hideHeader ? NOOP : <AssetListHeaderRenderer {...data} />;
    }

    const isNotUniqueToken = (
      type === ViewTypes.COIN_ROW
      || type === ViewTypes.COIN_ROW_LAST
      || type === ViewTypes.UNISWAP_ROW
      || type === ViewTypes.UNISWAP_ROW_LAST
      || type === ViewTypes.FOOTER
    );

    // TODO sections
    return isNotUniqueToken
      ? renderItem({ item })
      : renderItem({
        childrenAmount: item.childrenAmount,
        familyId: item.familyId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        item: item.tokens,
        marginTop: type.isFirst ? 4 : 0,
        shouldPrioritizeImageLoading: index < get(sections, '[0].data.length', 0) + 9,
        uniqueId: item.uniqueId,
      });
  };

  render() {
    const {
      externalScrollView,
      fetchData,
      hideHeader,
      renderAheadOffset,
      ...props
    } = this.props;
    const { dataProvider, headersIndices } = this.state;

    return (
      <View backgroundColor={colors.white} flex={1} overflow="hidden">
        <StickyContainer stickyHeaderIndices={headersIndices}>
          <RecyclerListView
            {...props}
            dataProvider={dataProvider}
            extendedState={headersIndices}
            itemAnimator={layoutItemAnimator}
            externalScrollView={externalScrollView}
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
)(RecyclerAssetList);
