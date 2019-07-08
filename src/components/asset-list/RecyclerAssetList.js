import {
  findIndex,
  get,
  has,
  indexOf,
  keyBy,
  keys,
} from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { RefreshControl } from 'react-native';
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
import { UniqueTokenRow } from '../unique-token';
import AssetListHeader from './AssetListHeader';

export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1, // eslint-disable-line sort-keys
  COIN_ROW_LAST: 2,
  UNIQUE_TOKEN_ROW: 3,
  UNIQUE_TOKEN_ROW_FIRST: 4,
  UNIQUE_TOKEN_ROW_LAST: 5,
  UNISWAP_ROW: 6,
  UNISWAP_ROW_LAST: 7,
};

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

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

export default class RecyclerAssetList extends PureComponent {
  static propTypes = {
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    paddingBottom: PropTypes.number,
    renderAheadOffset: PropTypes.number,
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

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
      isRefreshing: false,
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        const { sections } = this.props;
        const { headersIndices } = this.state;

        if (headersIndices.includes(index)) {
          return ViewTypes.HEADER;
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
          const totalCollectibles = get(sections, `[${collectiblesIndex}].data.length`, 0);

          if (index === headersIndices[collectiblesIndex] + 1) {
            return ViewTypes.UNIQUE_TOKEN_ROW_FIRST;
          }
          if (index === (totalCollectibles + headersIndices[collectiblesIndex])) {
            return ViewTypes.UNIQUE_TOKEN_ROW_LAST;
          }
          if (index > headersIndices[collectiblesIndex]) {
            return ViewTypes.UNIQUE_TOKEN_ROW;
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

        if (type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = UniqueTokenRow.getHeight(false, false);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
          // We want to add enough spacing below the list so that when the user scrolls to the bottom,
          // the bottom of the list content lines up with the top of the FABs (+ padding).
          dim.height = UniqueTokenRow.getHeight(false, true) + (props.paddingBottom || 0);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
          dim.height = UniqueTokenRow.getHeight(true, false);
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = this.state.areSmallCollectibles ? CoinRow.height : CoinRow.height + ListFooter.height - 1;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRow.height;
        } else if (type === ViewTypes.UNISWAP_ROW_LAST) {
          dim.height = UniswapInvestmentCard.height + InvestmentCard.margin.vertical + ListFooter.height + 7;
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

  componentWillUnmount = () => {
    this.isCancelled = true;
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

    const isUniqueToken = (
      type === ViewTypes.UNIQUE_TOKEN_ROW
      || type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST
      || type === ViewTypes.UNIQUE_TOKEN_ROW_LAST
    );

    return !isUniqueToken
      ? renderItem({ item })
      : renderItem({
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
            {...props}
            layoutProvider={this.layoutProvider}
            dataProvider={dataProvider}
            extendedState={{ headersIndices }}
            renderAheadOffset={renderAheadOffset}
            rowRenderer={this.rowRenderer}
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
