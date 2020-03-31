import PropTypes from 'prop-types';
import React from 'react';
import { compose } from 'recompact';
import { View } from 'react-native';
import styled from 'styled-components/primitives';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { Text } from '../text';
import { ShadowStack } from '../shadow-stack';
import { withAccountInfo } from '../../hoc';
import GraphemeSplitter from 'grapheme-splitter';

const AvatarCircle = styled(View)`
  height: 65px;
  margin-bottom: 16px;
  width: 65px;
`;

const FirstLetter = styled(Text)`
  color: #fff;
  font-size: 38;
  font-weight: 600;
  letter-spacing: 1.2;
  line-height: 66;
  text-align: center;
  width: 100%;
`;

const ProfileAction = ({ onPress, accountColor, accountName }) => (
  <ButtonPressAnimation
    hapticType="impactMedium"
    onPress={onPress}
    scaleTo={0.86}
    paddingTop={1}
  >
    <ShadowStack
      backgroundColor={colors.avatarColor[accountColor]}
      borderRadius={65}
      height={65}
      width={65}
      marginBottom={16}
      shadows={[
        [0, 2, 2.5, colors.dark, 0.08],
        [0, 6, 5, colors.dark, 0.12],
      ]}
      shouldRasterizeIOS
    >
      <AvatarCircle backgroundColor={colors.avatarColor[accountColor]}>
        <FirstLetter>
          {new GraphemeSplitter().splitGraphemes(accountName)[0]}
        </FirstLetter>
        <InnerBorder opacity={0.04} radius={65} />
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
