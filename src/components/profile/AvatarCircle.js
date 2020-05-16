import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { withAccountInfo } from '../../hoc';
import { colors, position } from '../../styles';
import { getFirstGrapheme } from '../../utils';
import { ButtonPressAnimation } from '../animations';
import { InnerBorder } from '../layout';
import { Text } from '../text';

const ProfileActionSize = 65;

const FirstLetter = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  letterSpacing: 2,
  lineHeight: 66,
  size: 38,
  weight: 'semibold',
})`
  width: 100%;
`;

const FirstLetterCircleBackground = styled.View`
  ${position.size(ProfileActionSize)};
  background-color: ${({ color }) => color};
  margin-bottom: 16;
`;

const ProfileAction = ({
  accountColor,
  accountName,
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
      hapticType="impactMedium"
      marginTop={2}
      onPress={onPress}
      pressOutDuration={200}
      scaleTo={0.9}
    >
      <ShadowStack
        {...position.sizeAsObject(ProfileActionSize)}
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={ProfileActionSize}
        marginBottom={12}
        shadows={shadows[overlayStyles ? 'overlay' : 'default']}
      >
        <FirstLetterCircleBackground color={colors.avatarColor[accountColor]}>
          <FirstLetter>{getFirstGrapheme(accountName)}</FirstLetter>
          {!overlayStyles && (
            <InnerBorder opacity={0.02} radius={ProfileActionSize} />
          )}
        </FirstLetterCircleBackground>
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

export default withAccountInfo(ProfileAction);
