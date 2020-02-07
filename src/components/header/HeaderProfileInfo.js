import PropTypes from 'prop-types';
import React from 'react';
import styled from 'styled-components/primitives';
import { compose, shouldUpdate } from 'recompact';
import FastImage from 'react-native-fast-image';
import { View, Text } from 'react-native';
import GraphemeSplitter from 'grapheme-splitter';
import { ButtonPressAnimation } from '../animations';
import { colors, fonts } from '../../styles';
import Caret from '../../assets/family-dropdown-arrow.png';
import { TruncatedAddress } from '../text';
import { removeFirstEmojiFromString } from '../../helpers/emojiHandler';

const Container = styled.View`
  height: 46px;
  background-color: ${colors.skeleton};
  margin-left: 6px;
  border-radius: 23px;
  align-items: center;
  flex-direction: row;
`;

const RightSide = styled.View``;

const TopRow = styled.View`
  flex-direction: row;
`;

const ArrowWrapper = styled.View`
  height: 16px;
  width: 12px;
  padding-left: 10px;
  padding-right: 20px;
  padding-top: 2px;
  justify-content: center;
  align-items: center;
`;

const Nickname = styled.Text`
  font-family: ${fonts.family.SFProText};
  font-weight: ${fonts.weight.medium};
  font-size: ${fonts.size.smedium};
  color: ${colors.dark};
  max-width: 120px;
`;

const SettingIcon = styled(FastImage)`
  height: 12px;
  width: 6px;
  transform: rotate(90deg);
`;

const AddressAbbreviation = styled(TruncatedAddress).attrs({
  firstSectionLength: 6,
  size: 'smaller',
  truncationLength: 4,
  weight: 'medium',
})`
  color: ${colors.blueGreyDark};
  font-family: ${fonts.family.SFProText};
  opacity: 0.5;
  padding-right: 15px;
  width: 100%;
`;

const AvatarCircle = styled(View)`
  border-radius: 20px;
  margin-left: 8;
  margin-right: 9px;
  height: 32px;
  width: 32px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 18;
  line-height: 31;
  padding-left: 0.5px;
`;

const HeaderProfileInfo = ({
  accountAddress,
  accountColor,
  accountName,
  onPress,
}) => {
  const name = accountName || 'My Wallet';
  const color = accountColor || 0;

  return (
    <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
      <Container>
        <AvatarCircle style={{ backgroundColor: colors.avatarColor[color] }}>
          <FirstLetter>
            {new GraphemeSplitter().splitGraphemes(name)[0]}
          </FirstLetter>
        </AvatarCircle>
        <RightSide>
          <TopRow>
            <Nickname numberOfLines={1}>
              {removeFirstEmojiFromString(name)}
            </Nickname>
            <ArrowWrapper>
              <SettingIcon source={Caret} />
            </ArrowWrapper>
          </TopRow>
          <AddressAbbreviation address={accountAddress} />
        </RightSide>
      </Container>
    </ButtonPressAnimation>
  );
};

HeaderProfileInfo.propTypes = {
  accountAddress: PropTypes.string,
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  onPress: PropTypes.func.isRequired,
};

export default compose(
  shouldUpdate((props, nextProps) => {
    return nextProps.shouldUpdate;
  })
)(HeaderProfileInfo);
