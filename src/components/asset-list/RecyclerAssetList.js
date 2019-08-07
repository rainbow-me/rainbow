import {
  findIndex,
  get,
  has,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { LayoutAnimation, RefreshControl } from 'react-native';
import { connect } from 'react-redux';
import { pure } from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives';
import { withOpenFamilyTabs, withOpenInvestmentCards, withOpenBalances } from '../../hoc';
import { colors } from '../../styles';
import { deviceUtils, isNewValueForPath, safeAreaInsetValues } from '../../utils';
import { CoinRow, CollectiblesSendRow } from '../coin-row';
import { InvestmentCard, UniswapInvestmentCard, InvestmentCardHeader } from '../investment-cards';
import { ListFooter } from '../list';
import { CardMargin, CardSize, RowPadding } from '../unique-token/UniqueTokenRow';
import AssetListHeader from './AssetListHeader';
import CoinDivider from '../coin-divider/CoinDivider';
import SmallBalancesWrapper from '../coin-divider/SmallBalancesWrapper';

export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1, // eslint-disable-line sort-keys
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

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

const NOOP = () => undefined;

const layoutItemAnimator = {
  animateDidMount: NOOP,
  animateShift: () => LayoutAnimation.configureNext({
    duration: 200,
    update: {
      initialVelocity: 0,
      springDamping: 1,
      type: LayoutAnimation.Types.spring,
    },
  }),
  animateWillMount: NOOP,
  animateWillUnmount: NOOP,
  animateWillUpdate: NOOP,
};


// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = pure(data => <AssetListHeader {...data} />);

const hasRowChanged = (r1, r2) => {
  if (has(r1, 'isHeader')) {
    const isNewTitle = isNewValueForPath(r1, r2, 'title');
    const isNewTotalItems = isNewValueForPath(r1, r2, 'totalItems');
    const isNewTotalValue = isNewValueForPath(r1, r2, 'totalValue');

    return isNewTitle || isNewTotalItems || isNewTotalValue;
  }

  const isNewAsset = isNewValueForPath(r1, r2, 'item.uniqueId');
  const isNewTokenFirst = isNewValueForPath(r1, r2, 'item.tokens.[0].uniqueId');
  const isNewTokenSecond = isNewValueForPath(r1, r2, 'item.tokens.[1].uniqueId');
  const isNewUniswapFirst = isNewValueForPath(r1, r2, 'item.tokens.[0].percentageOwned');
  const isNewUniswapSecond = isNewValueForPath(r1, r2, 'item.tokens.[1].percentageOwned');

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(r1, r2, 'item.native.balance.display');
  }

  return isNewAsset
    || isNewAssetBalance
    || isNewTokenFirst
    || isNewTokenSecond
    || isNewUniswapFirst
    || isNewUniswapSecond;
};

class RecyclerAssetList extends PureComponent {
  static propTypes = {
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    openFamilyTabs: PropTypes.array,
    openInvestmentCards: PropTypes.array,
    openSmallBalances: PropTypes.bool,
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

  position = 0;

  contentSize = 0;

  layoutMeasurement = 0;

  refresh = false;

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
      isRefreshing: false,
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const {
          openFamilyTabs, openInvestmentCards, sections,
        } = this.props;
        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }

        if (index === this.state.length - 1) {
          return ViewTypes.FOOTER;
        }

        const balancesIndex = findIndex(sections, ({ name }) => name === 'balances');
        const collectiblesIndex = findIndex(sections, ({ name }) => name === 'collectibles');
        const investmentsIndex = findIndex(sections, ({ name }) => name === 'investments');

        if (balancesIndex > -1) {
          const balanceItemsCount = get(sections, `[${balancesIndex}].data.length`, 0);
          const lastBalanceIndex = headersIndices[balancesIndex] + balanceItemsCount;
          if (index === lastBalanceIndex) {
            if (sections[balancesIndex].data[lastBalanceIndex - 1].smallBalancesContainer) {
              return ViewTypes.COIN_SMALL_BALANCES;
            }
            return ViewTypes.COIN_ROW_LAST;
          }
        }

        if (investmentsIndex > -1) {
          const investmentItemsCount = get(sections, `[${investmentsIndex}].data.length`, 0);
          const lastInvestmentIndex = headersIndices[investmentsIndex] + investmentItemsCount;

          if ((index > headersIndices[investmentsIndex]) && (index <= lastInvestmentIndex)) {
            if (!openInvestmentCards[sections[investmentsIndex].data[index - headersIndices[investmentsIndex] - 1].uniqueId]) {
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
            if (openFamilyTabs[sections[collectiblesIndex].data[familyIndex].familyName]) {
              if (get(sections, `[${collectiblesIndex}].data[${familyIndex}].tokens`)) {
                return {
                  get: ViewTypes.UNIQUE_TOKEN_ROW,
                  isLast: index === this.state.length - 2,
                  size: get(sections, `[${collectiblesIndex}].data[${familyIndex}].tokens`, []).length,
                };
              }
            }
            return {
              get: ViewTypes.UNIQUE_TOKEN_ROW_CLOSED,
              isLast: index === this.state.length - 2,
            };
          }
        }

        return ViewTypes.COIN_ROW;
      },
      (type, dim) => {
        dim.width = deviceUtils.dimensions.width;
        if (this.state.areSmallCollectibles
          && (
            type === ViewTypes.UNIQUE_TOKEN_ROW_LAST
            || type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST
            || type === ViewTypes.UNIQUE_TOKEN_ROW
          )
        ) {
          dim.height = CoinRow.height;
          if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
            dim.height += CollectiblesSendRow.dividerHeight;
          } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
            // We want to add enough spacing below the list so that when the user scrolls to the bottom,
            // the bottom of the list content lines up with the top of the FABs (+ padding).
            dim.height += (props.paddingBottom || 0);
          }
          return;
        }
        if (type.get === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = type.size * CardSize + 54 + CardMargin * (type.size - 1) + (type.isLast ? 90 : 0);
        } else if (type.get === ViewTypes.UNIQUE_TOKEN_ROW_CLOSED) {
          dim.height = 54 + (type.isLast ? 90 : 0);
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = this.state.areSmallCollectibles ? CoinRow.height : CoinRow.height + ListFooter.height + 1;
        } else if (type === ViewTypes.COIN_SMALL_BALANCES) {
          const balancesIndex = findIndex(this.props.sections, ({ name }) => name === 'balances');
          const size = this.props.sections[balancesIndex].data[this.props.sections[balancesIndex].data.length - 1].assets.length;
          dim.height = this.props.openSmallBalances ? CoinDivider.height + (size * CoinRow.height) + ListFooter.height + 9 : CoinDivider.height + ListFooter.height + 16;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
        } else if (type === ViewTypes.UNISWAP_ROW_LAST) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical + ListFooter.height + 8;
        } else if (type === ViewTypes.UNISWAP_ROW) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
        } else if (type === ViewTypes.UNISWAP_ROW_CLOSED_LAST) {
          dim.height = InvestmentCardHeader.height + InvestmentCard.margin.vertical + ListFooter.height + 8;
        } else if (type === ViewTypes.UNISWAP_ROW_CLOSED) {
          dim.height = InvestmentCardHeader.height + InvestmentCard.margin.vertical;
        } else if (type === ViewTypes.HEADER) {
          dim.height = this.props.hideHeader ? 0 : AssetListHeader.height;
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
      length: items.length,
    };
  }

  shouldComponentUpdate = (prev, next) => {
    if (prev.openFamilyTabs !== this.props.openFamilyTabs) {
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
      while (i < collectibles.data.length) {
        if (this.props.openFamilyTabs[collectibles.data[i].familyName] === true && !prev.openFamilyTabs[collectibles.data[i].familyName]) {
          let collectiblesHeight = 0;
          for (let j = 0; j < i; j++) {
            if (this.props.openFamilyTabs[collectibles.data[j].familyName] && collectibles.data[j].tokens) {
              collectiblesHeight += collectibles.data[j].tokens.length * CardSize + 54 + (RowPadding - 4) * (collectibles.data[j].tokens.length - 1);
            } else {
              collectiblesHeight += 54;
            }
          }
          let investmentHeight = 0;
          if (investments.data) {
            for (let k = 0; k < investments.data.length; k++) {
              if (!this.props.openInvestmentCards[investments.data[k].uniqueId]) {
                investmentHeight += (UniswapInvestmentCard.height + InvestmentCard.margin.vertical);
              } else {
                investmentHeight += (InvestmentCardHeader.height + InvestmentCard.margin.vertical);
              }
            }
          }
          let balancesHeight = 0;
          if (balances.data) {
            balancesHeight += CoinRow.height * (balances.data.length - 1);
            if (balances.data[balances.data.length - 1].smallBalancesContainer) {
              balancesHeight += CoinDivider.height + ListFooter.height;
              if (this.props.openSmallBalances) {
                balancesHeight += CoinRow.height * balances.data[balances.data.length - 1].assets.length;
              }
            } else {
              balancesHeight += CoinRow.height + ListFooter.height;
            }
          }
          const verticalOffset = 10;
          const deviceDimensions = deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 210 : 235);
          const sectionBeforeCollectibles = AssetListHeader.height * (this.props.sections.length - 1) + ListFooter.height * (this.props.sections.length - 1) + balancesHeight + investmentHeight;
          const sectionsHeight = sectionBeforeCollectibles + collectiblesHeight;
          const renderSize = CardSize * collectibles.data[i].tokens.length + RowPadding * (collectibles.data[i].tokens.length - 1) - verticalOffset;

          if (renderSize >= deviceDimensions) {
            const scrollDistance = sectionsHeight - this.position;
            this.scrollToOffset(this.position + scrollDistance - verticalOffset);
          } else {
            const diff = this.position - sectionsHeight + deviceDimensions;
            if (renderSize > diff) {
              const scrollDistance = deviceDimensions > renderSize ? renderSize - diff : deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 250 : 280);
              this.scrollToOffset(this.position + scrollDistance);
            }
          }
          break;
        }
        i++;
      }
    }
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
    clearInterval(this.interval);
  };

  scrollToOffset = (position) => {
    setTimeout(() => {
      this.rlv.scrollToOffset(0, position, true);
    }, 50);
  }

  getStableId = (index) => {
    const row = get(this.state, `dataProvider._data[${index}]`);
    let stableId;
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

    if (index === this.state.dataProvider._data.length - 1) {
      return 'footer';
    }

    return stableId;
  };

  handleRefresh = () => {
    if (this.state.isRefreshing) return;
    this.setState({ isRefreshing: true });
    this.props.fetchData().then(() => {
      if (!this.isCancelled) {
        this.setState({ isRefreshing: false });
      }
    }).catch(error => {
      if (!this.isCancelled) {
        this.setState({ isRefreshing: false });
      }
    });
  };

  renderRefreshControl = () => (
    <RefreshControl
      onRefresh={this.handleRefresh}
      refreshing={this.state.isRefreshing}
      tintColor={colors.alpha(colors.blueGreyLight, 0.666)}
    />
  );

  rowRenderer = (type, data, index) => {
    const { item, renderItem } = data;
    const { hideHeader, sections } = this.props;

    if (type === ViewTypes.HEADER) {
      return hideHeader ? null : <AssetListHeaderRenderer {...data} />;
    }

    if (type === ViewTypes.COIN_SMALL_BALANCES) {
      const renderList = [];
      for (let i = 0; i < item.assets.length; i++) {
        const selectedItem = { item: item.assets[i] };
        renderList.push(renderItem(selectedItem));
      }

      const wrappedRenderList = <SmallBalancesWrapper assets={renderList} />;
      return wrappedRenderList;
    }

    const isNotUniqueToken = (
      type === ViewTypes.COIN_ROW
      || type === ViewTypes.COIN_ROW_LAST
      || type === ViewTypes.UNISWAP_ROW
      || type === ViewTypes.UNISWAP_ROW_LAST
      || type === ViewTypes.UNISWAP_ROW_CLOSED
      || type === ViewTypes.UNISWAP_ROW_CLOSED_LAST
    );

    // TODO sections
    return isNotUniqueToken
      ? renderItem({ item })
      : renderItem({
        childrenAmount: item.childrenAmount,
        familyId: item.familyId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        isFirstRow: type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST,
        isLastRow: type === ViewTypes.UNIQUE_TOKEN_ROW_LAST,
        item: item.tokens,
        shouldPrioritizeImageLoading: index < sections[0].data.length + 9,
        uniqueId: item.uniqueId,
      });
  };

  render() {
    const { hideHeader, renderAheadOffset, ...props } = this.props;
    const { dataProvider, headersIndices } = this.state;

    return (
      <Wrapper>
        <StickyContainer stickyHeaderIndices={headersIndices}>
          <RecyclerListView
            ref={ref => { this.rlv = ref; }}
            {...props}
            layoutProvider={this.layoutProvider}
            dataProvider={dataProvider}
            renderAheadOffset={renderAheadOffset}
            itemAnimator={layoutItemAnimator}
            rowRenderer={this.rowRenderer}
            onScroll={(event, _offsetX, offsetY) => {
              this.position = offsetY;
              if (this.contentSize !== event.nativeEvent.contentSize.height) {
                this.contentSize = event.nativeEvent.contentSize.height;
              }
              if (this.layoutMeasurement !== event.nativeEvent.layoutMeasurement.height) {
                this.layoutMeasurement = event.nativeEvent.layoutMeasurement.height;
              }
              if ((event.nativeEvent.contentSize.height - event.nativeEvent.layoutMeasurement.height >= offsetY && offsetY >= 0)
                || (offsetY < -60 && offsetY > -62)) {
                if (this.props.scrollViewTracker) {
                  this.props.scrollViewTracker.setValue(offsetY);
                }
              }
            }}
            scrollIndicatorInsets={{
              bottom: safeAreaInsetValues.bottom,
              top: hideHeader ? 0 : AssetListHeader.height,
            }}
            scrollViewProps={{
              refreshControl: this.renderRefreshControl(),
            }}
          />
        </StickyContainer>
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  selectedWithFab: {
    scrollingVelocity,
  },
}) => ({
  scrollingVelocity,
});
export default connect(mapStateToProps)(withOpenFamilyTabs(withOpenInvestmentCards(withOpenBalances(RecyclerAssetList))));
