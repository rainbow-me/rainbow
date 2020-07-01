import React, { useMemo } from 'react';
import ShadowStack from 'react-native-shadow-stack';
import styled from 'styled-components/primitives';
import { ButtonPressAnimation } from '../animations';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';

const AvatarCircleSize = 65;

const AvatarCircleView = styled(Flex)`
  ${position.size(AvatarCircleSize)};
  margin-bottom: 16px;
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

export default function AvatarCircle({
  accountColor = 0,
  accountSymbol = '🤔',
  isAvatarPickerAvailable,
  onPress,
  overlayStyles,
}) {
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
        {...position.sizeAsObject(AvatarCircleSize)}
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={AvatarCircleSize}
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
}
