import React, { useMemo } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import ImageAvatar from '../contacts/ImageAvatar';
import { Flex, InnerBorder } from '../layout';
import { Text } from '../text';
import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import { useAccountProfile, useLatestCallback } from '@/hooks';
import styled from '@/styled-thing';
import { position } from '@/styles';
import ShadowStack from '@/react-native-shadow-stack';

const AvatarCircleSize = 65;

const AvatarCircleView = styled(Flex)({
  ...position.sizeAsObject(AvatarCircleSize),
  alignItems: ios ? 'flex-start' : 'center',
  justifyContent: ios ? 'flex-start' : 'center',
  marginBottom: 16,
});

const FirstLetter = styled(Text).attrs(({ theme: { colors } }) => ({
  align: 'center',
  color: colors.whiteLabel,
  letterSpacing: 2,
  size: ios ? 38 : 30,
  weight: 'semibold',
  ...(ios && { lineHeight: 66 }),
}))({
  ...(android && { left: -1 }),
  ...(ios && { width: 67 }),
});

export default function AvatarCircle({
  isAvatarPickerAvailable,
  overlayStyles,
  image,
  onPress,
  showcaseAccountSymbol,
  showcaseAccountColor,
  onSelectionCallback = () => {},
  menuOptions = [],
  newProfile = false,
  ...props
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
      : colors.avatarBackgrounds[(!newProfile && profileAccountColor) ?? 10];
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

  const items = useMemo(
    () => ({
      menuItems: menuOptions?.map(label => ({
        actionKey: label,
        actionTitle: label,
      })),
    }),
    [menuOptions]
  );

  const handlePressMenuItem = useLatestCallback(
    e => {
      const index = items.menuItems?.findIndex(
        item => item.actionKey === e.nativeEvent.actionKey
      );
      onSelectionCallback(index);
    },
    [onSelectionCallback, items.menuItems]
  );

  const Wrapper =
    ios || !isAvatarPickerAvailable ? React.Fragment : ContextMenuButton;

  return (
    <Wrapper menuConfig={items} onPressMenuItem={handlePressMenuItem}>
      <ButtonPressAnimation
        disabled={!isAvatarPickerAvailable}
        enableHapticFeedback={isAvatarPickerAvailable}
        marginTop={2}
        {...(ios && { onPress })}
        overflowMargin={30}
        pressOutDuration={200}
        scaleTo={isAvatarPickerAvailable ? 0.9 : 1}
        {...props}
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
    </Wrapper>
  );
}
