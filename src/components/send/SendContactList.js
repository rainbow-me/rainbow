import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import {
  compose,
  onlyUpdateForKeys,
  shouldUpdate,
  withHandlers,
} from 'recompact';
import { buildAssetUniqueIdentifier } from '../../helpers/assets';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import { CoinRow, CollectiblesSendRow, SendCoinRow } from '../coin-row';
import { ListFooter } from '../list';
import { View, Text } from 'react-primitives';
import { TouchableHighlight } from 'react-native-gesture-handler';
import { RecyclerListView, LayoutProvider, DataProvider } from "recyclerlistview";
import { LayoutAnimation } from 'react-native';
import FastImage from 'react-native-fast-image';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { colors } from '../../styles';

const rowHeight = 64;

class SendContactList extends React.Component {
  balancesRenderItem = item => {return <View style={{ height: 20, width: 200, backgroundColor: 'green' }}></View>; }

  constructor(args) {
    super(args);

    this._layoutProvider = new LayoutProvider((i) => {
      return 'COIN_ROW';
    }, (type, dim) => {
      if (type == "COIN_ROW") {
        dim.width = deviceUtils.dimensions.width;
        dim.height = rowHeight;
      } else {
        dim.width = 0;
        dim.height = 0;
      }
    });
    this._renderRow = this._renderRow.bind(this);
  }

  _renderRow(type, data) {
    if (type == "COIN_ROW") {
      return this.balancesRenderItem(data);
    } else {
      return this.balancesRenderItem(data);
    }
  }

  shouldComponentUpdate (prev) {
    if(this.props.allAssets !== prev.allAssets) {
      return true;
    } else {
      return false;
    }
  }

  render() {
    return (
      <FlyInAnimation style={{ flex: 1, width: '100%' }}>
        <RecyclerListView
          rowRenderer={this._renderRow}
          dataProvider={
            new DataProvider((r1, r2) => {
              return r1 !== r2;
            }).cloneWithRows(this.props.allAssets)
          }
          layoutProvider={this._layoutProvider}
        />
      </FlyInAnimation>
    );
  };
}

export default SendContactList;
