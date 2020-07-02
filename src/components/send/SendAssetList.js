import React, { Fragment } from 'react';
import { LayoutAnimation } from 'react-native';
import FastImage from 'react-native-fast-image';
import { View } from 'react-primitives';
import { onlyUpdateForKeys } from 'recompact';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { buildCoinsList } from '../../helpers/assets';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import {
  CollectiblesSendRow,
  SendCoinRow,
  SendSavingsCoinRow,
} from '../coin-row';
import SavingsListHeader from '../savings/SavingsListHeader';
import TokenFamilyHeader from '../token-family/TokenFamilyHeader';
import SendAssetListSmallBalancesHeader from './SendAssetListSmallBalancesHeader';
import { colors } from '@rainbow-me/styles';

const dividerHeight = 18;
const familyRowHeight = 58;
const familyHeaderHeight = 62;
const rowHeight = 64;
const smallBalancesHeader = 36;

const Divider = styled.View`
  background-color: ${colors.lighterGrey};
  height: 2px;
  margin: 10px 19px;
  width: 100%;
`;

class SendAssetList extends React.Component {
  constructor(props) {
    super(props);

    const {
      allAssets,
      hiddenCoins,
      nativeCurrency,
      pinnedCoins,
      savings,
      uniqueTokens,
    } = props;

    const { assets } = buildCoinsList(
      allAssets,
      nativeCurrency,
      true,
      pinnedCoins,
      hiddenCoins
    );
    let smallBalances = [];
    let shitcoins = [];

    if (assets[assets.length - 1].smallBalancesContainer) {
      smallBalances = assets.pop();
      shitcoins = smallBalances.assets;
    }

    if (assets[assets.length - 1].coinDivider) {
      assets.pop(); // removes not needed coin divider
    }

    const visibleAssetsLength = assets.length;
    this.data = assets;
    if (smallBalances.assets.length > 0) {
      this.data.push(smallBalances);
    }

    if (savings && savings.length > 0) {
      this.data = this.data.concat([{ data: savings, name: 'Savings' }]);
    }
    if (uniqueTokens && uniqueTokens.length > 0) {
      this.data = this.data.concat(uniqueTokens);
    }
    this.state = {
      dataProvider: new DataProvider((r1, r2) => {
        return r1 !== r2;
      }).cloneWithRows(this.data),
      openCards: [],
      openSavings: true,
      openShitcoins: false,
      visibleAssetsLength: visibleAssetsLength,
    };

    const imageTokens = [];
    uniqueTokens.forEach(family => {
      family.data.forEach(token => {
        if (token.image_thumbnail_url) {
          imageTokens.push({
            id: token.id,
            uri: token.image_thumbnail_url,
          });
        }
      });
    });
    FastImage.preload(imageTokens);

    this._layoutProvider = new LayoutProvider(
      i => {
        if (i < visibleAssetsLength - 1) {
          return 'COIN_ROW';
        } else if (i === visibleAssetsLength - 1) {
          return (savings && savings.length !== 0) ||
            (shitcoins && shitcoins.length !== 0)
            ? 'COIN_ROW'
            : 'COIN_ROW_LAST';
        } else if (
          i === visibleAssetsLength &&
          shitcoins &&
          shitcoins.length > 0
        ) {
          return {
            size: this.state.openShitcoins ? rowHeight * shitcoins.length : 0,
            type: 'SHITCOINS_ROW',
          };
        } else if (
          (i === visibleAssetsLength ||
            (i === visibleAssetsLength + 1 &&
              shitcoins &&
              shitcoins.length > 0)) &&
          savings &&
          savings.length > 0
        ) {
          return {
            size: this.state.openSavings ? rowHeight * savings.length : 0,
            type: 'SAVINGS_ROW',
          };
        } else {
          if (
            this.state.openCards[
              uniqueTokens[
                i -
                  visibleAssetsLength -
                  (savings && savings.length > 0 ? 1 : 0) -
                  (shitcoins && shitcoins.length > 0 ? 1 : 0)
              ].familyId
            ]
          ) {
            return {
              size:
                uniqueTokens[
                  i -
                    visibleAssetsLength -
                    (savings && savings.length > 0 ? 1 : 0) -
                    (shitcoins && shitcoins.length > 0 ? 1 : 0)
                ].data.length + 1,
              type: 'COLLECTIBLE_ROW',
            };
          } else {
            return 'COLLECTIBLE_ROW_CLOSED';
          }
        }
      },
      (type, dim) => {
        dim.width = deviceUtils.dimensions.width;
        if (type === 'COIN_ROW') {
          dim.height = rowHeight;
        } else if (type === 'COIN_ROW_LAST') {
          dim.height = rowHeight + dividerHeight;
        } else if (type.type === 'SHITCOINS_ROW') {
          dim.height =
            type.size +
            smallBalancesHeader +
            (savings && savings.length > 0 ? 0 : dividerHeight);
        } else if (type.type === 'SAVINGS_ROW') {
          dim.height = type.size + familyHeaderHeight + dividerHeight;
        } else if (type.type === 'COLLECTIBLE_ROW') {
          dim.height = familyHeaderHeight + (type.size - 1) * familyRowHeight;
        } else if (type === 'COLLECTIBLE_ROW_CLOSED') {
          dim.height = familyHeaderHeight;
        } else {
          dim.height = 0;
        }
      }
    );
    this._renderRow = this._renderRow.bind(this);
  }

  rlv = React.createRef();

  changeOpenTab = index => {
    const { openCards } = this.state;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    openCards[index] = !openCards[index];
    this.setState({ openCards });
    let familiesHeight = 0;
    if (openCards[index]) {
      for (let i = 0; i < index; i++) {
        if (openCards[i]) {
          familiesHeight +=
            familyHeaderHeight +
            this.props.uniqueTokens[i].data.length * familyRowHeight;
        } else {
          familiesHeight += familyHeaderHeight;
        }
      }
      const smallBalanesheight =
        this.props.allAssets.length === this.state.visibleAssetsLength
          ? 0
          : smallBalancesHeader +
            (this.state.openShitcoins
              ? (this.props.allAssets.length - this.state.visibleAssetsLength) *
                rowHeight
              : 0);
      const savingsHeight =
        this.props.savings?.length > 0
          ? familyHeaderHeight +
            (this.state.openSavings ? this.props.savings.length * rowHeight : 0)
          : 0;
      const heightBelow =
        this.state.visibleAssetsLength * rowHeight +
        smallBalanesheight +
        savingsHeight +
        familiesHeight +
        dividerHeight;
      const renderSize =
        familyHeaderHeight +
        this.props.uniqueTokens[index].data.length * familyRowHeight;
      const screenHeight = this.position + this.componentHeight;
      if (heightBelow + renderSize + 64 > screenHeight) {
        if (renderSize < this.componentHeight) {
          setTimeout(() => {
            this.rlv.scrollToOffset(
              0,
              this.position +
                (heightBelow + renderSize - screenHeight + familyHeaderHeight),
              true
            );
          }, 10);
        } else {
          setTimeout(() => {
            this.rlv.scrollToOffset(
              0,
              this.position - (this.position - heightBelow),
              true
            );
          }, 10);
        }
      }
    }
  };

  changeOpenSavings = () => {
    const { openSavings } = this.state;
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    const newOpenSavings = !openSavings;
    this.setState({ openSavings: newOpenSavings });
  };

  changeOpenShitcoins = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')
    );
    this.setState(prev => ({ openShitcoins: !prev.openShitcoins }));
  };

  mapTokens = collectibles =>
    collectibles.map(collectible => (
      <CollectiblesSendRow
        item={collectible}
        key={collectible.id}
        onPress={() => this.props.onSelectAsset(collectible)}
      />
    ));

  balancesRenderItem = item => (
    <SendCoinRow
      {...item}
      onPress={() => this.props.onSelectAsset(item)}
      rowHeight={rowHeight}
    />
  );

  mapSavings = savings =>
    savings.map(token => (
      <SendSavingsCoinRow
        item={token}
        key={token.address}
        onPress={() => this.props.onSelectAsset(token)}
      />
    ));

  mapShitcoins = shitcoins =>
    shitcoins.map(token => (
      <SendCoinRow
        key={token.uniqueId}
        onPress={() => this.props.onSelectAsset(token)}
        rowHeight={rowHeight}
        top={0}
        {...token}
      />
    ));

  balancesRenderLastItem = item => (
    <Fragment>
      <SendCoinRow
        {...item}
        onPress={() => this.props.onSelectAsset(item)}
        rowHeight={rowHeight}
      />
      <Divider />
    </Fragment>
  );

  collectiblesRenderItem = item => {
    return (
      <View>
        <TokenFamilyHeader
          childrenAmount={item.data.length}
          familyImage={item.familyImage}
          isCoinRow
          isOpen={this.state.openCards[item.familyId]}
          onPress={() => {
            this.changeOpenTab(item.familyId);
          }}
          title={item.name}
        />
        {this.state.openCards[item.familyId] && this.mapTokens(item.data)}
      </View>
    );
  };

  savingsRenderItem = item => (
    <View marginTop={10}>
      <SavingsListHeader
        isOpen={this.state.openSavings}
        onPress={() => {
          this.changeOpenSavings();
        }}
      />
      {this.state.openSavings && this.mapSavings(item.data)}
      <Divider />
    </View>
  );

  shitcoinsRenderItem = item => (
    <View marginTop={10}>
      <SendAssetListSmallBalancesHeader
        openShitcoins={this.state.openShitcoins}
        onPress={this.changeOpenShitcoins}
      />
      {this.state.openShitcoins && this.mapShitcoins(item.assets)}
      {this.props.savings && this.props.savings.length > 0 ? null : <Divider />}
    </View>
  );

  _renderRow(type, data) {
    if (type === 'COIN_ROW') {
      return this.balancesRenderItem(data);
    } else if (type === 'COIN_ROW_LAST') {
      return this.balancesRenderLastItem(data);
    } else if (type.type === 'SHITCOINS_ROW') {
      return this.shitcoinsRenderItem(data);
    } else if (type.type === 'SAVINGS_ROW') {
      return this.savingsRenderItem(data);
    } else if (type.type === 'COLLECTIBLE_ROW') {
      return this.collectiblesRenderItem(data);
    } else if (type === 'COLLECTIBLE_ROW_CLOSED') {
      return this.collectiblesRenderItem(data);
    }
    return null;
  }

  render() {
    return (
      <FlyInAnimation>
        <RecyclerListView
          disableRecycling
          ref={ref => {
            this.rlv = ref;
          }}
          rowRenderer={this._renderRow}
          dataProvider={this.state.dataProvider}
          layoutProvider={this._layoutProvider}
          onScroll={event => {
            this.componentHeight = event.nativeEvent.layoutMeasurement.height;
            this.position = event.nativeEvent.contentOffset.y;
          }}
          style={{ minHeight: 1 }}
        />
      </FlyInAnimation>
    );
  }
}

export default onlyUpdateForKeys(['allAssets', 'uniqueTokens'])(SendAssetList);
