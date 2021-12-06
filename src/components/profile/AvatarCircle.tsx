import React, { useMemo } from 'react';
import styled from 'styled-components';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../contacts/ImageAvatar' was resolved to '... Remove this comment to see the full error message
import ImageAvatar from '../contacts/ImageAvatar';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
import { useAccountProfile } from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'react-native-shadow-stack' or ... Remove this comment to see the full error message
import ShadowStack from 'react-native-shadow-stack';

const AvatarCircleSize = 65;

const AvatarCircleView = styled(Flex)`
  ${position.size(AvatarCircleSize)};
  margin-bottom: 16px;
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  justify-content: ${ios ? 'flex-start' : 'center'};
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  align-items: ${ios ? 'flex-start' : 'center'};
`;

const FirstLetter = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 2,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  lineHeight: android ? 68 : 66,
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  size: ios ? 38 : 30,
  weight: 'semibold',
}))`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
  width: ${android ? 66 : 67};
`;

export default function AvatarCircle({
  isAvatarPickerAvailable,
  onPress,
  overlayStyles,
  image,
  showcaseAccountSymbol,
  showcaseAccountColor,
}: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <ButtonPressAnimation
      disabled={!isAvatarPickerAvailable}
      enableHapticFeedback={isAvatarPickerAvailable}
      marginTop={2}
      onPress={onPress}
      pressOutDuration={200}
      scaleTo={isAvatarPickerAvailable ? 0.9 : 1}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ShadowStack
        {...position.sizeAsObject(AvatarCircleSize)}
        backgroundColor={overlayStyles ? 'rgb(51, 54, 59)' : colors.white}
        borderRadius={AvatarCircleSize}
        marginBottom={12}
        shadows={shadows[overlayStyles ? 'overlay' : 'default']}
        // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
        {...(android && {
          height: 64,
          width: 64,
        })}
      >
        {image ? (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <ImageAvatar image={image} size="large" />
        ) : (
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
          <AvatarCircleView backgroundColor={resolvedColor}>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <FirstLetter>{accountSymbol}</FirstLetter>
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            {!overlayStyles && <InnerBorder opacity={0.02} radius={65} />}
          </AvatarCircleView>
        )}
      </ShadowStack>
    </ButtonPressAnimation>
  );
}
