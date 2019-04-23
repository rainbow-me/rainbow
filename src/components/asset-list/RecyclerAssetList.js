import { get } from 'lodash';
import React from 'react';
import { Dimensions, RefreshControl } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import PropTypes from 'prop-types';
import { UniqueTokenRowHeight } from '../unique-token/UniqueTokenRow';
import { CoinRowHeight } from '../coin-row/CoinRow';
import AssetListHeader from './AssetListHeader';
import { colors } from '../../styles';
import { DividerHeight } from '../coin-row/CollectiblesSendRow';

const ViewTypes = {
  COIN_ROW: 0,
  HEADER: 1,
  UNIQUE_TOKEN_ROW: 2,
  UNIQUE_TOKEN_ROW_FIRST: 3,
  UNIQUE_TOKEN_ROW_LAST: 4,
};

const Wrapper = styled.View`
  flex: 1;
  overflow: hidden;
`;

// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = ({ section }) => <AssetListHeader {...section} />;


export default class RecyclerAssetList extends React.Component {
  static propTypes = {
    externalScrollView: PropTypes.any,
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    paddingBottom: PropTypes.number,
    sections: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.array,
      title: PropTypes.string,
    })),
  };

  constructor(props) {
    super(props);
    const { width } = Dimensions.get('window');
    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        if (get(r1, 'isHeader') && get(r1, 'symbol') !== get(r2, 'symbol')) {
          return true;
        }
        if (get(r1, 'isHeader') && get(r1, 'section.totalValue') !== get(r2, 'section.totalValue')) {
          return true;
        }
        const r1Value = get(r1, r1.tokens ? '' : 'native.balance.display');
        const r2Value = get(r2, r2.tokens ? '' : 'native.balance.display');
        const r1Symbol = get(r1, 'symbol');
        const r2Symbol = get(r2, 'symbol');

        const r1TokenName0 = get(r1, 'tokens.[0].name');
        const r2TokenName0 = get(r2, 'tokens.[0].name');
        const r1TokenName1 = get(r1, 'tokens.[1].name');
        const r2TokenName1 = get(r2, 'tokens.[1].name');
        return r1Symbol !== r2Symbol
          || r1Value !== r2Value
          || r1TokenName0 !== r2TokenName0
          || r1TokenName1 !== r2TokenName1;
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
        const areBalancesLoaded = this.props.sections[0] && get(this.props.sections[0], 'balances');
        const areCollectiblesLoaded = this.props.sections.length === 2
          || (this.props.sections[0] && get(this.props.sections[0], 'collectibles'));
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
        if (
          this.state.areSmallCollectibles
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
          section,
          symbol: section.title,
        }])
        .concat(section.data.map(s => ({ ...s, section })));
    }, []);
    const areSmallCollectibles = (c => c && c.type === 'small')(props.sections.find(e => e.collectibles))
    return {
      areSmallCollectibles,
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      isRefreshing: false,
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
    if (type === ViewTypes.COIN_ROW) {
      const { section } = data;
      return data.section.renderItem({ item: data, section });
    }
    if (type === ViewTypes.HEADER) {
      if (this.props.hideHeader) {
        return null;
      }
      return <AssetListHeaderRenderer {...data} />;
    }

    return data.section.renderItem({
      data: data.tokens ? data.tokens : data,
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
            externalScrollView={this.props.externalScrollView}
            layoutProvider={this.layoutProvider}
            dataProvider={this.state.dataProvider}
            rowRenderer={this.rowRenderer}
            renderAheadOffset={1000}
            scrollViewProps={{
              refreshControl: this.props.fetchData && this.renderRefreshControl(),
            }}
          />
        </StickyContainer>
      </Wrapper>
    );
  }
}
