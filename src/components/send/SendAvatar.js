import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives/dist/styled-components-primitives.esm';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Animated } from 'react-native';
import GraphemeSplitter from 'grapheme-splitter';
import FastImage from 'react-native-fast-image';
import { View, Text } from 'react-primitives';
import { abbreviations, deviceUtils } from '../../utils';
import { colors, fonts } from '../../styles';
import { TruncatedAddress } from '../text';
import { ButtonPressAnimation } from '../animations';
import {
  deleteLocalContact,
} from '../../handlers/commonStorage';
import { showActionSheetWithOptions } from '../../utils/actionsheet';
import EditIcon from '../../assets/swipeToEdit.png';
import DeleteIcon from '../../assets/swipeToDelete.png';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';


const AvatarWrapper = styled(View)`
  flex-direction: row;
  margin: 17px 15px 5px 15px;
`;

const AvatarCircle = styled(View)`
  height: 40px;
  width: 40px;
  border-radius: 20px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  line-height: 39px;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
`;

const ContactColumn = styled(View)`
  height: 40px;
  flex-direction: column;
  justify-content: space-between;
  margin-left: 10px;
`;

const TopRow = styled(Text)`
  font-family: ${fonts.family.SFProText};
  font-size: 16;
  font-weight: 500;
  letter-spacing: ${fonts.letterSpacing.tight};
  width: ${deviceUtils.dimensions.width - 90};
`;

const BottomRow = styled(TruncatedAddress).attrs({
  align: 'left',
  color: colors.blueGreyDark,
  firstSectionLength: abbreviations.defaultNumCharsPerSection,
  size: 'smedium',
  truncationLength: 4,
  weight: 'regular',
})`
  font-family: ${fonts.family.SFProText};
  opacity: 0.4;
  width: 100%;
`;

const RightActionText = styled(Text)`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFProText};
  font-size: ${fonts.size.smaller};
  font-weight: ${fonts.weight.medium};
  letter-spacing: ${fonts.letterSpacing.tight};
  opacity: 0.4;
  text-align: center;
`;

const ActionIcon = styled(FastImage)`
  width: 35px;
  height: 35px;
  margin: 0px 10px 5px 10px;
`;

class SendAvatar extends React.PureComponent {
  componentWillReceiveProps = () => {
    this.close();
  }

  onPress = () => {
    this.props.onPress(this.props.address);
  }

  onLongPress = () => {
    this._swipeableRow.openRight();
  }

  renderRightAction = (text, x, progress, onPress) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [x, 0],
    });

    return (
      <Animated.View style={{
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        marginRight: text === 'Edit' ? 0 : 10,
        marginTop: 12,
        transform: [{ translateX: trans }],
      }}>
        <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
          <ActionIcon source={text === 'Edit' ? EditIcon : DeleteIcon} />
          <RightActionText>
            {text}
          </RightActionText>
        </ButtonPressAnimation>
      </Animated.View>
    );
  };

  deleteHandler = async () => {
    this.close();
    showActionSheetWithOptions({
      cancelButtonIndex: 1,
      destructiveButtonIndex: 0,
      options: ['Delete Contact', 'Cancel'],
    }, async (buttonIndex) => {
      if (buttonIndex === 0) {
        await deleteLocalContact(this.props.address);
        // Alert({title: `Success`, message: `Contact has been deleted from your address book`})
        this.props.onChange();
      }
    });
  };

  editHandler = async () => {
    console.log(this.props);
    this.close();
    this.props.navigation.navigate('ExpandedAssetScreen', {
      address: this.props.address,
      asset: [],
      color: this.props.color,
      contact: {
        address: this.props.address,
        color: this.props.color,
        nickname: this.props.nickname,
      },
      onCloseModal: this.props.onChange,
      type: 'contact',
    });
  };

  renderRightActions = progress => (
    <View style={{ flexDirection: 'row', width: 120 }}>
      {this.renderRightAction('Edit', 120, progress, this.editHandler)}
      {this.renderRightAction('Delete', 90, progress, this.deleteHandler)}
    </View>
  );

  updateRef = ref => {
    this._swipeableRow = ref;
  };

  close = () => {
    this._swipeableRow.close();
  };

  render() {
    const {
      address,
      color,
      nickname,
      onTouch,
    } = this.props;
    const displayName = removeFirstEmojiFromString(nickname);

    return (
      <Swipeable
        ref={this.updateRef}
        friction={2}
        rightThreshold={0}
        renderRightActions={this.renderRightActions}
        onSwipeableWillOpen={() => this.props.onTransitionEnd(address)} >
        <ButtonPressAnimation onPressStart={() => onTouch(address)} onLongPress={this.onLongPress} onPress={this.onPress} scaleTo={0.96}>
          <AvatarWrapper>
            <AvatarCircle style={{ backgroundColor: colors.avatarColor[color] }} >
              <FirstLetter>
                {new GraphemeSplitter().splitGraphemes(nickname)[0]}
              </FirstLetter>
            </AvatarCircle>
            <ContactColumn>
              <TopRow numberOfLines={1}>
                {displayName}
              </TopRow>
              <BottomRow address={address} />
            </ContactColumn>
          </AvatarWrapper>
        </ButtonPressAnimation>
      </Swipeable>
    );
  }
}

SendAvatar.propTypes = {
  address: PropTypes.string,
  color: PropTypes.number,
  navigation: PropTypes.object,
  nickname: PropTypes.string,
  onChange: PropTypes.func,
  onPress: PropTypes.func,
  onTouch: PropTypes.func,
  onTransitionEnd: PropTypes.func,
};

export default SendAvatar;
