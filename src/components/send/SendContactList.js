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
import { abbreviations } from '../../utils';
import { Monospace, TruncatedAddress } from '../text';
import { ButtonPressAnimation } from '../animations';

const rowHeight = 62;

const AvatarWrapper = styled(View)`
  flex-direction: row;
  margin: 11px 15px;
`;

const AvatarCircle = styled(View)`
  height: 40px;
  width: 40px;
  border-radius: 20px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  line-height: 40px;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
`;

const Column = styled(View)`
  height: 40px;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 11px;
`;

const TopRow = styled(Text)`
  font-weight: 500,
  font-size: 16
`;

const BottomRow = styled(TruncatedAddress).attrs({
  align: 'left',
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'smedium',
  truncationLength: 4,
  weight: 'regular',
  color: colors.blueGreyDark,
})`
  opacity: 0.4;
  width: 100%;
`;


class Avatar extends React.PureComponent {

  onPress = () => {
    this.props.onPress(this.props.address);
  }

  render() {
   const item = this.props;
    return <ButtonPressAnimation onPress={this.onPress} scaleTo={0.96}>
    <AvatarWrapper>
      <AvatarCircle style= {{backgroundColor: colors.avatarColor[item.color]}} >
        <FirstLetter>{item.nickname[0].toUpperCase()}</FirstLetter>
      </AvatarCircle>
      <Column>
        <TopRow>
          {item.nickname}
        </TopRow>
        <BottomRow address={item.address} />
      </Column>
    </AvatarWrapper>
    </ButtonPressAnimation>
  }
}

class SendContactList extends React.Component {
  balancesRenderItem = item => <Avatar onPress={this.props.onPressContact} {...item} />

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
    let newAssets = Object.assign([], this.props.allAssets);
    newAssets.reverse();
    
    return (
      <FlyInAnimation style={{ flex: 1, width: '100%' }}>
        <RecyclerListView
          rowRenderer={this._renderRow}
          dataProvider={
            new DataProvider((r1, r2) => {
              return r1 !== r2;
            }).cloneWithRows(newAssets)
          }
          layoutProvider={this._layoutProvider}
        />
      </FlyInAnimation>
    );
  };
}

export default SendContactList;
