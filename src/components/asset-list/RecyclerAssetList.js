import { get } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Dimensions, RefreshControl } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { colors } from '../../styles';
import { isNewValueForPath } from '../../utils';
import { DividerHeight } from '../coin-row/CollectiblesSendRow';
import { CoinRowHeight } from '../coin-row/CoinRow';
import { ListFooter } from '../list';
import { UniqueTokenRowHeight } from '../unique-token/UniqueTokenRow';
import AssetListHeader from './AssetListHeader';

export const ViewTypes = {
  HEADER: 0,
  COIN_ROW: 1,
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

export default class RecyclerAssetList extends React.Component {
  static propTypes = {
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    paddingBottom: PropTypes.number,
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
    const { width } = Dimensions.get('window');
    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        const isNewHeaderValue = isNewValueForPath(r1, r2, 'title')
          || isNewValueForPath(r1, r2, 'totalValue');

        if (get(r1, 'isHeader') && isNewHeaderValue) {
          return true;
        }

        const isNewSymbol = isNewValueForPath(r1, r2, 'item.symbol');

        const isNewTokenNameFirst = isNewValueForPath(r1, r2, 'item.tokens.[0].id');
        const isNewTokenNameSecond = isNewValueForPath(r1, r2, 'item.tokens.[1].id');

        const r1Value = get(r1, get(r1, 'item.tokens') ? '' : 'item.native.balance.display');
        const r2Value = get(r2, get(r2, 'item.tokens') ? '' : 'item.native.balance.display');

        return isNewSymbol
          || r1Value !== r2Value
          || isNewTokenNameFirst
          || isNewTokenNameSecond;
      }),
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
        dim.width = width;
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
          }
          return;
        }

        if (type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = UniqueTokenRowHeight(false, false);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
          // We want to add enough spacing below the list so that when the user scrolls to the bottom,
          // the bottom of the list content lines up with the top of the FABs (+ padding).
          dim.height = (UniqueTokenRowHeight(false, true)) + props.paddingBottom || 0;
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
          dim.height = UniqueTokenRowHeight(true, false);
        } else if (type === ViewTypes.COIN_ROW_LAST) {
          dim.height = CoinRowHeight + ListFooter.height;
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRowHeight;
        } else {
          dim.height = this.props.hideHeader ? 0 : AssetListHeader.height;
        }
      },
    );
  }

  static getDerivedStateFromProps(props, state) {
    const headersIndices = [];
    const items = props.sections.reduce((ctx, section) => {
      headersIndices.push(ctx.length);
      return ctx
        .concat([{
          isHeader: true,
          ...section.header,
        }])
        .concat(section.data.map(item => ({ item: { ...item, ...section.perData }, renderItem: section.renderItem })));
    }, []);
    const areSmallCollectibles = (c => c && get(c, 'type') === 'small')(props.sections.find(e => e.collectibles));
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

  rowRenderer = (type, data) => {
    const { item, renderItem } = data;
    const { hideHeader } = this.props;

    if (type === ViewTypes.HEADER) {
      return hideHeader ? null : <AssetListHeaderRenderer {...data} />;
    }

    return (type === ViewTypes.COIN_ROW || type === ViewTypes.COIN_ROW_LAST)
      ? renderItem({ item })
      : renderItem({
        data: item.tokens ? item.tokens : item,
        isFirstRow: type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST,
        isLastRow: type === ViewTypes.UNIQUE_TOKEN_ROW_LAST,
      });
  };

  render() {
    return (
      <Wrapper>
        <StickyContainer
          stickyHeaderIndices={this.state.headersIndices}
        >
          <RecyclerListView
            layoutProvider={this.layoutProvider}
            dataProvider={this.state.dataProvider}
            rowRenderer={this.rowRenderer}
            renderAheadOffset={1000}
            scrollViewProps={{
              refreshControl: this.renderRefreshControl(),
            }}
          />
        </StickyContainer>
      </Wrapper>
    );
  }
}
