import React, { useMemo } from 'react';
import styled from 'styled-components';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import ImageAvatar from '../contacts/ImageAvatar';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';
import { useAccountProfile } from '@rainbow-me/hooks';
import { position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const AvatarCircleSize = 65;

const AvatarCircleView = styled(Flex)`
  ${position.size(AvatarCircleSize)};
  margin-bottom: 16px;
  justify-content: ${ios ? 'flex-start' : 'center'};
  align-items: ${ios ? 'flex-start' : 'center'};
`;

const FirstLetter = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 2,
  lineHeight: android ? 68 : 66,
  size: ios ? 38 : 30,
  weight: 'semibold',
}))`
  width: ${android ? 66 : 67};
`;

export default function AvatarCircle({
  isAvatarPickerAvailable,
  onPress,
  overlayStyles,
  image,
  showcaseAccountSymbol,
  showcaseAccountColor,
}) {
  const { colors, isDarkMode } = useTheme();
  const {
    accountColor: profileAccountColor,
    accountSymbol: profileAccountSymbol,
  } = useAccountProfile();
  const accountSymbol = showcaseAccountSymbol || profileAccountSymbol;
  const resolvedColor =
    showcaseAccountColor != null
      ? typeof showcaseAccountColor === 'string'
        ? showcaseAccountColor
        : colors.avatarBackgrounds[showcaseAccountColor]
      : colors.avatarBackgrounds[profileAccountColor || 0];
  const shadows = useMemo(
    () => ({
      default: [
        [0, 2, 5, isDarkMode ? colors.trueBlack : colors.dark, 0.2],
        [
          0,
          6,
          10,
          isDarkMode ? colors.trueBlack : colors.alpha(resolvedColor, 0.6),
        ],
      ],
      overlay: [
        [0, 6, 10, isDarkMode ? colors.trueBlack : colors.shadowBlack, 0.08],
        [0, 2, 5, isDarkMode ? colors.trueBlack : colors.shadowBlack, 0.12],
      ],
    }),
    [resolvedColor, colors, isDarkMode]
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
          <AvatarCircleView backgroundColor={resolvedColor}>
            <FirstLetter>{accountSymbol}</FirstLetter>
            {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
          </AvatarCircleView>
        )}
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
