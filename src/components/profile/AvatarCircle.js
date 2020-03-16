import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'recompact';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Text } from '../text';
import { ShadowStack } from '../shadow-stack';
import { withAccountInfo } from '../../hoc';
import GraphemeSplitter from 'grapheme-splitter';

const AvatarCircle = styled(View)`
  border-radius: 33px;
  margin-bottom: 16px;
  height: 65px;
  width: 65px;
`;

const FirstLetter = styled(Text)`
  width: 100%;
  text-align: center;
  color: #fff;
  font-weight: 600;
  font-size: 37;
  line-height: 65;
`;

const ProfileAction = ({ onPress, accountColor, accountName }) => (
  <ButtonPressAnimation
    hapticType="impactMedium"
    onPress={onPress}
    scaleTo={0.82}
    paddingTop={2}
  >
    <ShadowStack
      height={65}
      width={65}
      marginBottom={16}
      borderRadius={40}
      shadows={[
        [0, 6, 10, colors.dark, 0.12],
        [0, 2, 5, colors.dark, 0.08],
      ]}
      shouldRasterizeIOS
    >
      <AvatarCircle
        style={{ backgroundColor: colors.avatarColor[accountColor] }}
      >
        <FirstLetter>
          {new GraphemeSplitter().splitGraphemes(accountName)[0]}
        </FirstLetter>
      </AvatarCircle>
    </ShadowStack>
  </ButtonPressAnimation>
);

ProfileAction.propTypes = {
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  onPress: PropTypes.func,
};

ProfileAction.defaultProps = {
  accountColor: 0,
  accountName: '🤔',
};

export default compose(withAccountInfo)(ProfileAction);
