import connect from 'react-redux/es/connect/connect';
import {
  get,
  has,
  indexOf,
  keyBy,
  keys,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { RefreshControl, LayoutAnimation } from 'react-native';
import { pure } from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives';
import {
  buildAssetHeaderUniqueIdentifier,
  buildAssetUniqueIdentifier,
} from '../../helpers/assets';
import { colors } from '../../styles';
import { deviceUtils, isNewValueForPath, safeAreaInsetValues } from '../../utils';
import { CoinRow, CollectiblesSendRow } from '../coin-row';
import { InvestmentCard, UniswapInvestmentCard } from '../investment-cards';
import { ListFooter } from '../list';
import AssetListHeader from './AssetListHeader';
import { withOpenFamilyTabs } from '../../hoc';
import { CardMargin, CardSize } from '../unique-token/UniqueTokenRow';

export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1, // eslint-disable-line sort-keys
  COIN_ROW_LAST: 2,
  UNIQUE_TOKEN_ROW: 3,
  UNIQUE_TOKEN_ROW_CLOSED: 4,
  UNIQUE_TOKEN_ROW_CLOSED_LAST: 5,
  UNIQUE_TOKEN_ROW_FIRST: 8, // TODO remove
  UNIQUE_TOKEN_ROW_LAST: 9, // TODO remove
  UNISWAP_ROW: 6,
  UNISWAP_ROW_LAST: 7,
};

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

const NOOP = () => undefined;

const layoutItemAnimator = {
  animateDidMount: NOOP,
  animateShift: NOOP,
  animateWillMount: NOOP,
  animateWillUnmount: NOOP,
  animateWillUpdate: () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')),
};


// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = pure(data => <AssetListHeader {...data} />);

const hasRowChanged = (r1, r2) => {
  if (has(r1, 'isHeader')) {
    const isNewShowShitcoinsValue = isNewValueForPath(r1, r2, 'showShitcoins');
    const isNewTitle = isNewValueForPath(r1, r2, 'title');
    const isNewTotalItems = isNewValueForPath(r1, r2, 'totalItems');
    const isNewTotalValue = isNewValueForPath(r1, r2, 'totalValue');

    return isNewShowShitcoinsValue || isNewTitle || isNewTotalItems || isNewTotalValue;
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

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
      isRefreshing: false,
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const { sections, openFamilyTabs } = this.props;
        const { headersIndices } = this.state;
        if (headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }

        // This logic appears to be quite complex since there might be some race conditions
        // regarding order of received sections while importing from seeds
        const sectionsByType = keyBy(sections, 'name');

        const areBalancesLoaded = has(sectionsByType, 'balances');
        const areCollectiblesLoaded = has(sectionsByType, 'collectibles');
        const areInvestmentsLoaded = has(sectionsByType, 'investments');

        if (areBalancesLoaded) {
          if (index === headersIndices[1] - 1) {
            return ViewTypes.COIN_ROW_LAST;
          }
        }

        if (areInvestmentsLoaded) {
          const idx = indexOf(keys(sectionsByType), 'investments');
          const nextSectionIdx = (headersIndices[idx + 1]);

          if ((index > headersIndices[idx]) && (index < nextSectionIdx)) {
            return index === nextSectionIdx - 1
              ? ViewTypes.UNISWAP_ROW_LAST
              : ViewTypes.UNISWAP_ROW;
          }
        }

        if (areCollectiblesLoaded) {
          const idx = indexOf(keys(sectionsByType), 'collectibles');
          if (index > headersIndices[idx]) {
            const familyIndex = index - headersIndices[idx] - 1;
            if (openFamilyTabs[familyIndex]) {
              if(sections[idx].data[familyIndex].tokens) {
                return {
                  get: ViewTypes.UNIQUE_TOKEN_ROW,
                  isLast: index === this.state.length - 1,
                  size: get(sections, `[${idx}].data[${familyIndex}]`).tokens.length,
                };
              }
            } else if (index === this.state.length - 1) {
              return ViewTypes.UNIQUE_TOKEN_ROW_CLOSED_LAST;
            }
            return ViewTypes.UNIQUE_TOKEN_ROW_CLOSED;
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
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_CLOSED) {
          dim.height = 54;
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_CLOSED_LAST) {
          dim.height = 54 + 90;
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = this.state.areSmallCollectibles ? CoinRow.height : CoinRow.height + ListFooter.height;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
        } else if (type === ViewTypes.UNISWAP_ROW_LAST) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical + ListFooter.height;
        } else if (type === ViewTypes.UNISWAP_ROW) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical;
        } else {
          dim.height = this.props.hideHeader ? 0 : AssetListHeader.height;
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
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(sections.find(e => e.collectibles));
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      length: items.length,
    };
  }

  componentDidMount = () => {
    this.isCancelled = false;
  };

  // TODO
  componentDidUpdate(prev) {
    // sorry
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
      while(i < this.props.openFamilyTabs.length) {
        if(this.props.openFamilyTabs[i] === true && prev.openFamilyTabs[i] === false) {
          setTimeout(() => {
            let collectiblesHeight = 0;
            for(let j = 0; j < i; j++) {
              if(this.props.openFamilyTabs[j] === true) {
                collectiblesHeight += this.props.sections[1].data[j].tokens.length * CardSize + 54 + 20 * (this.props.sections[1].data[j].tokens.length - 1);
              } else {
                collectiblesHeight += 54;
              }
            }
            const diff = this.position - (CoinRow.height * this.props.sections[0].data.length + AssetListHeader.height * this.props.sections.length + collectiblesHeight) + (deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 210 : 235));
            const renderSize = CardSize * this.props.sections[1].data[i].tokens.length + 20 * (this.props.sections[1].data[i].tokens.length - 1);
            if(renderSize > diff) {
              const scrollDistance = deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 210 : 235) > renderSize ? renderSize - diff : deviceUtils.dimensions.height - (deviceUtils.isSmallPhone ? 250 : 280);
              this.rlv.scrollToOffset(0, this.position + scrollDistance , true);
            }
          }, 50);
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

  getStableId = (index) => {
    const row = get(this.state, `dataProvider._data[${index}]`);

    return has(row, 'isHeader')
      ? buildAssetHeaderUniqueIdentifier(row)
      : buildAssetUniqueIdentifier(row.item);
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

    const isNotUniqueToken = (
      type === ViewTypes.COIN_ROW
      || type === ViewTypes.COIN_ROW_LAST
      || type === ViewTypes.UNISWAP_ROW
      || type === ViewTypes.UNISWAP_ROW_LAST
    );

    // TODO sections
    return isNotUniqueToken
      ? renderItem({ item })
      : renderItem({
        isFirstRow: type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST,
        isLastRow: type === ViewTypes.UNIQUE_TOKEN_ROW_LAST,
        item: item.tokens,
        shouldPrioritizeImageLoading: index < sections[0].data.length + 9,
        uniqueId: item.uniqueId,
        familyImage: item.familyImage,
        familyName: item.familyName,
        familyId: item.familyId,
        childrenAmount: item.childrenAmount,
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
            extendedState={{ headersIndices }}
            renderAheadOffset={renderAheadOffset}
            itemAnimator={layoutItemAnimator}
            rowRenderer={this.rowRenderer}
            onScroll={event => {
              this.position = event.nativeEvent.contentOffset.y;
              if(this.props.scrollViewTracker) {
                this.props.scrollViewTracker.setValue(event.nativeEvent.contentOffset.y);
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
export default connect(mapStateToProps)(withOpenFamilyTabs(RecyclerAssetList));
