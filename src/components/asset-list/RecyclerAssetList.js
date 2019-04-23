import { get, has } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { RefreshControl } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import {
  buildAssetHeaderUniqueIdentifier,
  buildAssetUniqueIdentifier,
} from '../../helpers/assets';
import { colors } from '../../styles';
import { deviceUtils, isNewValueForPath, safeAreaInsetValues } from '../../utils';
import { CoinRowHeight } from '../coin-row/CoinRow';
import { DividerHeight } from '../coin-row/CollectiblesSendRow';
import { ListFooter } from '../list';
import { UniqueTokenRowHeight } from '../unique-token/UniqueTokenRow';
import AssetListHeader from './AssetListHeader';

export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1, // eslint-disable-line sort-keys
  COIN_ROW_LAST: 2,
  UNIQUE_TOKEN_ROW: 3,
  UNIQUE_TOKEN_ROW_FIRST: 4,
  UNIQUE_TOKEN_ROW_LAST: 5,
};

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = (data) => <AssetListHeader {...data} />;

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

  const isCollectiblesRow = has(r1, 'item.tokens') && has(r2, 'item.tokens');
  let isNewAssetBalance = false;

  if (!isCollectiblesRow) {
    isNewAssetBalance = isNewValueForPath(r1, r2, 'item.native.balance.display');
  }

  return isNewAsset
    || isNewAssetBalance
    || isNewTokenFirst
    || isNewTokenSecond;
};

export default class RecyclerAssetList extends React.Component {
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
      perData: PropTypes.object,
      renderItem: PropTypes.func.isRequired,
      type: PropTypes.string,
    })),
  };

  constructor(props) {
    super(props);

    this.state = {
      dataProvider: new DataProvider(hasRowChanged, this.getStableId),
      headersIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        if (this.state.headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }
        // This logic appears to be quite complex since there might be some race conditions
        // regarding order of received sections while importing from seeds
        const areBalancesLoaded = get(this.props, 'sections[0].balances');
        const areCollectiblesLoaded = this.props.sections.length === 2
          || get(this.props, 'sections[0].collectibles');
        if (areBalancesLoaded && areCollectiblesLoaded) {
          if (index === this.state.headersIndices[1] - 1) {
            return ViewTypes.COIN_ROW_LAST;
          }
        }
        if (areCollectiblesLoaded) {
          const idx = areBalancesLoaded ? 1 : 0;
          if (index === this.state.headersIndices[idx] + 1) {
            return ViewTypes.UNIQUE_TOKEN_ROW_FIRST;
          }
          if (index === this.state.length - 1) {
            return ViewTypes.UNIQUE_TOKEN_ROW_LAST;
          }
          if (index > this.state.headersIndices[idx]) {
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
          dim.height = CoinRowHeight;
          if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
            dim.height += DividerHeight;
          } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
            // We want to add enough spacing below the list so that when the user scrolls to the bottom,
            // the bottom of the list content lines up with the top of the FABs (+ padding).
            dim.height += (props.paddingBottom || 0);
          }
          return;
        }

        if (type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = UniqueTokenRowHeight(false, false);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
          // We want to add enough spacing below the list so that when the user scrolls to the bottom,
          // the bottom of the list content lines up with the top of the FABs (+ padding).
          dim.height = UniqueTokenRowHeight(false, true) + (props.paddingBottom || 0);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
          dim.height = UniqueTokenRowHeight(true, false);
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = this.state.areSmallCollectibles ? CoinRowHeight : CoinRowHeight + ListFooter.height;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRowHeight;
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
  }

  handleRefresh = () => {
    if (this.state.isRefreshing) return;
    this.setState({ isRefreshing: true });
    this.props.fetchData().then(() => {
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

    return (type === ViewTypes.COIN_ROW || type === ViewTypes.COIN_ROW_LAST)
      ? renderItem({ item })
      : renderItem({
        data: item.tokens ? item.tokens : item,
        isFirstRow: type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST,
        isLastRow: type === ViewTypes.UNIQUE_TOKEN_ROW_LAST,
        shouldPrioritizeImageLoading: index < sections[0].data.length + 9,
      });
  };

  render() {
    const { hideHeader, renderAheadOffset } = this.props;
    const { dataProvider, headersIndices } = this.state;

    return (
      <Wrapper>
        <StickyContainer stickyHeaderIndices={headersIndices}>
          <RecyclerListView
            layoutProvider={this.layoutProvider}
            dataProvider={dataProvider}
            renderAheadOffset={renderAheadOffset}
            rowRenderer={this.rowRenderer}
            scrollIndicatorInsets={{
              bottom: safeAreaInsetValues.bottom,
              top: hideHeader ? 0 : AssetListHeader.height,
            }}
            scrollThrottle={32}
            scrollViewProps={{
              refreshControl: this.renderRefreshControl(),
            }}
          />
        </StickyContainer>
      </Wrapper>
    );
  }
}
