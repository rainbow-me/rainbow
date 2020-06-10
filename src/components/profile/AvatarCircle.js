import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { colors, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';

const ProfileActionSize = 65;

const AvatarCircleView = styled(Flex)`
  height: 65px;
  margin-bottom: 16px;
  width: 65px;
`;

const FirstLetter = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  letterSpacing: 2,
  lineHeight: 64.5,
  size: 38,
  weight: 'semibold',
})`
  width: 65.5;
`;

const ProfileAction = ({
  accountColor,
  accountSymbol,
  isAvatarPickerAvailable,
  onPress,
  overlayStyles,
}) => {
  const shadows = useMemo(
    () => ({
      default: [
        [0, 2, 5, colors.dark, 0.2],
        [0, 6, 10, colors.alpha(colors.avatarColor[accountColor], 0.6)],
      ],
      overlay: [
        [0, 6, 10, colors.black, 0.08],
        [0, 2, 5, colors.black, 0.12],
      ],
    }),
    [accountColor]
  );

  return (
    <ButtonPressAnimation
      enableHapticFeedback={isAvatarPickerAvailable}
      marginTop={2}
      onPress={onPress}
      pressOutDuration={200}
      scaleTo={isAvatarPickerAvailable ? 0.9 : 1}
    >
      <ShadowStack
        {...position.sizeAsObject(ProfileActionSize)}
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={ProfileActionSize}
        marginBottom={12}
        shadows={shadows[overlayStyles ? 'overlay' : 'default']}
      >
        <AvatarCircleView backgroundColor={colors.avatarColor[accountColor]}>
          <FirstLetter>{accountSymbol}</FirstLetter>
          {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
        </AvatarCircleView>
      </ShadowStack>
    </ButtonPressAnimation>
  );
};

ProfileAction.propTypes = {
  accountColor: PropTypes.number,
  accountSymbol: PropTypes.string,
  isAvatarPickerAvailable: PropTypes.bool,
  onPress: PropTypes.func,
  overlayStyles: PropTypes.bool,
};

ProfileAction.defaultProps = {
  accountColor: 0,
  accountSymbol: '🤔',
};

export default ProfileAction;
