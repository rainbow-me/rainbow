import { get } from 'lodash';
import React from 'react';
import { Dimensions, RefreshControl } from 'react-native';
import { RecyclerListView, DataProvider, LayoutProvider } from 'recyclerlistview';
import StickyContainer from 'recyclerlistview/dist/reactnative/core/StickyContainer';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import PropTypes from 'prop-types';
import { compose, withHandlers } from 'recompact';
import { withNavigation } from 'react-navigation';
import { BalanceCoinRow } from '../coin-row/index';
import { UniqueTokenRow } from '../unique-token';
import { UniqueTokenRowHeight } from '../unique-token/UniqueTokenRow';
import { CoinRowHeight } from '../coin-row/CoinRow';
import AssetListHeader from './AssetListHeader';
import { colors } from '../../styles';

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

const enhanceRenderItem = compose(
  withNavigation,
  withHandlers({
    onPress: ({ assetType, navigation }) => (item) => {
      navigation.navigate('ExpandedAssetScreen', {
        asset: item,
        type: assetType,
      });
    },
  }),
);

const TokenItem = enhanceRenderItem(BalanceCoinRow);
const UniqueTokenItem = enhanceRenderItem(UniqueTokenRow);

const balancesRenderItem = item => <TokenItem {...item} assetType="token" />;
const collectiblesRenderItem = item => <UniqueTokenItem {...item} assetType="unique_token" />;

// eslint-disable-next-line react/prop-types
const AssetListHeaderRenderer = ({ section }) => <AssetListHeader {...section} />;


export default class RecyclerAssetList extends React.Component {
  static propTypes = {
    fetchData: PropTypes.func,
    hideHeader: PropTypes.bool,
    paddingBottom: PropTypes.number.isRequired,
    sections: PropTypes.arrayOf(PropTypes.shape({
      data: PropTypes.array,
    })),
  };

  constructor(props) {
    super(props);
    const { width } = Dimensions.get('window');
    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        const r1Key = get(r1, Array.isArray(r1) ? '[0].id' : 'symbol');
        const r2Key = get(r2, Array.isArray(r2) ? '[0].id' : 'symbol');
        return r1Key !== r2Key;
      }),
      headersIndices: [],
    };

    this.layoutProvider = new LayoutProvider(
      index => {
        if (this.state.headersIndices.includes(index)) {
          return ViewTypes.HEADER;
        }
        if (index < this.state.headersIndices[1]) {
          return ViewTypes.COIN_ROW;
        }
        if (index === this.state.headersIndices[1] + 1) {
          return ViewTypes.UNIQUE_TOKEN_ROW_FIRST;
        }
        if (index === this.state.length - 1) {
          return ViewTypes.UNIQUE_TOKEN_ROW_LAST;
        }
        return ViewTypes.UNIQUE_TOKEN_ROW;
      },
      (type, dim) => {
        dim.width = width;
        if (type === ViewTypes.UNIQUE_TOKEN_ROW) {
          dim.height = UniqueTokenRowHeight(false, false);
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_LAST) {
          dim.height = UniqueTokenRowHeight(false, true) + props.paddingBottom;
        } else if (type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST) {
          dim.height = UniqueTokenRowHeight(true, false);
        } else if (type === ViewTypes.COIN_ROW) {
          dim.height = CoinRowHeight;
        } else {
          dim.height = AssetListHeader.height;
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
          section,
          symbol: section.title,
        }])
        .concat(section.data);
    }, []);
    return {
      dataProvider: state.dataProvider.cloneWithRows(items),
      headersIndices,
      isRefreshing: false,
      length: items.length,
    };
  }

  componentDidMount = () => {
    this.isCancelled = false;
  }

  componentWillUnmount = () => {
    this.isCancelled = true;
  }

  handleRefresh = () => {
    if (this.state.isRefreshing) return;
    this.setState({ isRefreshing: true });
    this.props.fetchData().then(() => {
      if (!this.isCancelled) {
        this.setState({ isRefreshing: false });
      }
    });
  }

  renderRefreshControl = () => {
    return (
      <RefreshControl
        onRefresh={this.handleRefresh}
        refreshing={this.state.isRefreshing}
        tintColor={colors.alpha(colors.blueGreyLight, 0.666)}
      />
    );
  }

  rowRenderer = (type, data) => {
    if (type === ViewTypes.COIN_ROW) {
      return balancesRenderItem(data);
    }
    if (type === ViewTypes.HEADER) {
      return <AssetListHeaderRenderer {...data} />;
    }

    return collectiblesRenderItem({
      isFirstRow: type === ViewTypes.UNIQUE_TOKEN_ROW_FIRST,
      isLastRow: type === ViewTypes.UNIQUE_TOKEN_ROW_LAST,
      items: data,
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
