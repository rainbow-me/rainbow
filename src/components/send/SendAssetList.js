import React, { Fragment } from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import {
  CollectiblesSendRow,
  SendCoinRow,
  SendSavingsCoinRow,
} from '../coin-row';
import { View } from 'react-primitives';
import {
  DataProvider,
  LayoutProvider,
  RecyclerListView,
} from 'recyclerlistview';
import { LayoutAnimation } from 'react-native';
import SavingsListHeader from '../savings/SavingsListHeader';
import TokenFamilyHeader from '../token-family/TokenFamilyHeader';
import { sheetVerticalOffset } from '../../navigation/transitions/effects';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { colors } from '../../styles';

const dividerHeight = 18;
const familyHeaderHeight = 62;
const rowHeight = 64;

const Divider = styled.View`
  background-color: ${colors.lighterGrey};
  height: 2px;
  margin: 10px 19px;
  width: 100%;
`;

class SendAssetList extends React.Component {
  constructor(props) {
    super(props);

    const { allAssets, savings, uniqueTokens } = props;
    this.data = allAssets;
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
        if (i < allAssets.length - 1) {
          return 'COIN_ROW';
        } else if (i === allAssets.length - 1) {
          return savings && savings.length !== 0 ? 'COIN_ROW' : 'COIN_ROW_LAST';
        } else if (i === allAssets.length && savings && savings.length > 0) {
          return {
            size: this.state.openSavings ? rowHeight * savings.length : 0,
            type: 'SAVINGS_ROW',
          };
        } else {
          if (
            this.state.openCards[
              uniqueTokens[
                i - allAssets.length - (savings && savings.length > 0 ? 1 : 0)
              ].familyId
            ]
          ) {
            return {
              size:
                uniqueTokens[
                  i - allAssets.length - (savings && savings.length > 0 ? 1 : 0)
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
        } else if (type.type === 'SAVINGS_ROW') {
          dim.height = type.size + familyHeaderHeight + dividerHeight;
        } else if (type.type === 'COLLECTIBLE_ROW') {
          dim.height = type.size * familyHeaderHeight;
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
            this.props.uniqueTokens[i].data.length * rowHeight;
        } else {
          familiesHeight += familyHeaderHeight;
        }
      }
      const heightBelow =
        this.props.allAssets.length * rowHeight +
        familiesHeight +
        dividerHeight;
      const renderSize =
        familyHeaderHeight +
        this.props.uniqueTokens[index].data.length * rowHeight;
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

  mapTokens = collectibles => {
    const items = collectibles.map(collectible => {
      const onPress = () => {
        this.props.onSelectAsset(collectible);
      };
      return (
        <CollectiblesSendRow
          key={collectible.id}
          item={collectible}
          onPress={onPress}
        />
      );
    });
    return items;
  };

  balancesRenderItem = item => {
    const onPress = () => {
      this.props.onSelectAsset(item);
    };
    return <SendCoinRow {...item} onPress={onPress} />;
  };

  mapSavings = savings => {
    const items = savings.map(token => {
      const onPress = () => {
        this.props.onSelectAsset(token);
      };
      return (
        <SendSavingsCoinRow
          key={token.address}
          item={token}
          onPress={onPress}
        />
      );
    });
    return items;
  };

  balancesRenderLastItem = item => {
    const onPress = () => {
      this.props.onSelectAsset(item);
    };
    return (
      <Fragment>
        <SendCoinRow {...item} onPress={onPress} />
        <Divider />
      </Fragment>
    );
  };

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

  _renderRow(type, data) {
    if (type === 'COIN_ROW') {
      return this.balancesRenderItem(data);
    } else if (type === 'COIN_ROW_LAST') {
      return this.balancesRenderLastItem(data);
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
      <FlyInAnimation
        style={{ flex: 1, paddingBottom: sheetVerticalOffset, width: '100%' }}
      >
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
