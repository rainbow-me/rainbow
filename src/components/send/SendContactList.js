import lang from 'i18n-js';
import PropTypes from 'prop-types';
import React from 'react';
import { deviceUtils } from '../../utils';
import { FlyInAnimation } from '../animations';
import { View, Text } from 'react-primitives';
import { RecyclerListView, LayoutProvider, DataProvider } from "recyclerlistview";
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import { colors } from '../../styles';
import { abbreviations } from '../../utils';
import { TruncatedAddress } from '../text';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import { Centered, Column, Row } from '../layout';
import transitionConfig from '../../navigation/transitions';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { RectButton } from 'react-native-gesture-handler';
import { Animated, LayoutAnimation } from 'react-native';
import {
  getLocalContacts,
  deleteLocalContact,
} from '../../handlers/commonStorage';

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

const ContactColumn = styled(View)`
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

const NOOP = () => undefined;

const layoutItemAnimator = {
  animateDidMount: NOOP,
  animateShift: NOOP,
  animateWillMount: NOOP,
  animateWillUnmount: NOOP,
  animateWillUpdate:  () => LayoutAnimation.configureNext(LayoutAnimation.create(200, 'easeInEaseOut', 'opacity')),
};


class Avatar extends React.PureComponent {

  onPress = () => {
    this.props.onPress(this.props.address);
  }

  renderRightAction = (text, color, x, progress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });

    const pressHandler = async () => {
      this.close();
      await deleteLocalContact(this.props.address);
      this.props.onChange();
    };

    return (
      <Animated.View style={{ flex: 1, transform: [{ translateX: trans }] }}>
        <RectButton
          style={[{
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
            backgroundColor: color 
          }]}
          onPress={pressHandler}>
          <Text style={{
            color: 'white',
            fontSize: 16,
            backgroundColor: 'transparent',
            padding: 10,
          }}>{text}</Text>
        </RectButton>
      </Animated.View>
    );
  };

  renderRightActions = progress => (
    <View style={{ width: 140, flexDirection: 'row' }}>
      {this.renderRightAction('Edit', '#ffab00', 140, progress)}
      {this.renderRightAction('Delete', '#dd2c00', 70, progress)}
    </View>
  );

  updateRef = ref => {
    this._swipeableRow = ref;
  };
  close = () => {
    this._swipeableRow.close();
  };

  render() {
    const item = this.props;
    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={this.renderRightActions}>
        <ButtonPressAnimation onPress={this.onPress} scaleTo={0.96}>
          <AvatarWrapper>
            <AvatarCircle style={{ backgroundColor: colors.avatarColor[item.color] }} >
              <FirstLetter>{item.nickname[0].toUpperCase()}</FirstLetter>
            </AvatarCircle>
            <ContactColumn>
              <TopRow>
                {item.nickname}
              </TopRow>
              <BottomRow address={item.address} />
            </ContactColumn>
          </AvatarWrapper>
        </ButtonPressAnimation>
      </Swipeable>
    )
  }
}

class SendContactList extends React.Component {
  balancesRenderItem = item => <Avatar onChange={this.onChangeContacts} onPress={this.props.onPressContact} {...item} />

  constructor(args) {
    super(args);
    
    this.state = {
      contacts: [],
    }

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

  onChangeContacts = async () => {
    const contacts = await getLocalContacts();
    let newAssets = Object.assign([], contacts);
    newAssets.reverse();
    this.setState({ contacts: newAssets });
  }

  componentWillReceiveProps = (props) => {
    let newAssets = Object.assign([], props.allAssets);
    newAssets.reverse();
    if(newAssets !== this.state.contacts) {
      this.setState({ contacts: newAssets });
    }
  }

  render() {
    return (
      <FlyInAnimation style={{ flex: 1, width: '100%' }}>
        {this.state.contacts.length == 0 ?
          <Column
            css={`
              background-color: ${colors.white};
              padding-bottom: ${transitionConfig.sheetVerticalOffset + 19};
            `}
            flex={1}
            justify="space-between"
          >
            <Centered flex={1} opacity={0.06}>
              <Icon
                color={colors.blueGreyDark}
                name="send"
                style={{ height: 88, width: 91 }}
              />
            </Centered>
          </Column>
          :
          <RecyclerListView
            rowRenderer={this._renderRow}
            dataProvider={
              new DataProvider((r1, r2) => {
                return r1 !== r2;
              }).cloneWithRows(this.state.contacts)
            }
            layoutProvider={this._layoutProvider}
            // itemAnimator={layoutItemAnimator}
          />
        }
      </FlyInAnimation>
    );
  };
}

export default SendContactList;
