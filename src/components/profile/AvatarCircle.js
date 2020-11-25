import React, { useMemo } from 'react';
import styled from 'styled-components/primitives';
import { useAccountProfile } from '../../hooks';
import { ButtonPressAnimation } from '../animations';
import ImageAvatar from '../contacts/ImageAvatar';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';
import { colors, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const AvatarCircleSize = 65;

const AvatarCircleView = styled(Flex)`
  ${position.size(AvatarCircleSize)};
  margin-bottom: 16px;
  justify-content: ${ios ? 'flex-start' : 'center'};
  align-items: ${ios ? 'flex-start' : 'center'};
`;

const FirstLetter = styled(Text).attrs({
  align: 'center',
  color: colors.white,
  letterSpacing: 2,
  lineHeight: android ? 68 : 66,
  size: ios ? 38 : 30,
  weight: 'semibold',
})`
  width: ${android ? 66 : 67};
`;

export default function AvatarCircle({
  isAvatarPickerAvailable,
  onPress,
  overlayStyles,
  image,
}) {
  const { accountColor, accountSymbol } = useAccountProfile();
  const shadows = useMemo(
    () => ({
      default: [
        [0, 2, 5, colors.dark, 0.2],
        [0, 6, 10, colors.alpha(colors.avatarColor[accountColor || 0], 0.6)],
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
      disabled={!isAvatarPickerAvailable}
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
        {...(android && {
          height: 64,
          width: 64,
        })}
      >
        {image ? (
          <ImageAvatar image={image} size="large" />
        ) : (
          <AvatarCircleView backgroundColor={colors.avatarColor[accountColor]}>
            <FirstLetter>{accountSymbol}</FirstLetter>
            {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
          </AvatarCircleView>
        )}
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
