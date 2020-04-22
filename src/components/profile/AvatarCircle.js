import GraphemeSplitter from 'grapheme-splitter';
import PropTypes from 'prop-types';
import React from 'react';
import { View } from 'react-native';
import ShadowStack from 'react-native-shadow-stack';
import { compose } from 'recompact';
import styled from 'styled-components/primitives';
import { withAccountInfo } from '../../hoc';
import { colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { Text } from '../text';

const AvatarCircle = styled(View)`
  height: 65px;
  margin-bottom: 16px;
  width: 65px;
`;

const FirstLetter = styled(Text)`
  color: #fff;
  font-size: 38;
  font-weight: 600;
  letter-spacing: 2;
  line-height: 66;
  text-align: center;
  width: 100%;
`;

const ProfileAction = ({
  accountColor,
  accountName,
  onPress,
  overlayStyles,
}) => {
  const AvatarCircleShadows = {
    default: [
      [0, 2, 5, colors.dark, 0.2],
      [0, 6, 10, colors.alpha(colors.avatarColor[accountColor], 0.6)],
    ],
    overlay: [
      [0, 6, 10, colors.black, 0.08],
      [0, 2, 5, colors.black, 0.12],
    ],
  };
  return (
    <ButtonPressAnimation
      hapticType="impactMedium"
      onPress={onPress}
      pressOutDuration={200}
      scaleTo={0.9}
      marginTop={2}
    >
      <ShadowStack
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={65}
        height={65}
        width={65}
        marginBottom={12}
        shadows={AvatarCircleShadows[overlayStyles ? 'overlay' : 'default']}
        shouldRasterizeIOS
      >
        <AvatarCircle backgroundColor={colors.avatarColor[accountColor]}>
          <FirstLetter>
            {new GraphemeSplitter().splitGraphemes(accountName)[0]}
          </FirstLetter>
          {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
        </AvatarCircle>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

ProfileAction.propTypes = {
  accountColor: PropTypes.number,
  accountName: PropTypes.string,
  onPress: PropTypes.func,
  overlayStyles: PropTypes.bool,
};

ProfileAction.defaultProps = {
  accountColor: 0,
  accountName: '🤔',
};

export default compose(withAccountInfo)(ProfileAction);
