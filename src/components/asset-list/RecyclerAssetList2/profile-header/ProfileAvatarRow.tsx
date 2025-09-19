import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import ContextMenu from '@/components/native-context-menu/contextMenu';
import { navbarHeight } from '@/components/navbar/Navbar';
import Skeleton from '@/components/skeleton/Skeleton';
import { AccentColorProvider, Box, Cover, useColorMode } from '@/design-system';
import { useLatestCallback, useOnAvatarPress } from '@/hooks';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { useAccountProfileInfo } from '@/state/wallets/walletsStore';
import { useTheme } from '@/theme';
import { getFirstGrapheme } from '@/utils';
import * as React from 'react';
import { Text as NativeText, Animated as RNAnimated } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRecyclerAssetListPosition } from '../core/Contexts';

export const ProfileAvatarRowHeight = 80;
export const ProfileAvatarRowTopInset = 24;
export const ProfileAvatarSize = 80;

export const ProfileAvatarRow = React.memo(function ProfileAvatarRow({ size = ProfileAvatarSize }: { size?: number }) {
  // ////////////////////////////////////////////////////
  // Account

  const { accountAddress, accountSymbol, accountColor, accountImage } = useAccountProfileInfo();

  const { avatarContextMenuConfig, onAvatarPressProfile, onSelectionCallback } = useOnAvatarPress({ screenType: 'wallet' });

  const dominantColor = usePersistentDominantColorFromImage(accountImage);

  // ////////////////////////////////////////////////////
  // Context Menu

  const ContextMenuButton = onAvatarPressProfile ? React.Fragment : ContextMenu;
  const contextMenuProps: Partial<React.ComponentProps<typeof ContextMenu>> | null = onAvatarPressProfile
    ? null
    : {
        menuConfig: avatarContextMenuConfig,
        onPressMenuItem: handlePressMenuItem,
        testID: 'avatar-button',
      };

  const handlePressMenuItem = useLatestCallback((e: any) => {
    const index = avatarContextMenuConfig?.menuItems?.findIndex(item => item && item.actionKey === e.nativeEvent.actionKey);
    onSelectionCallback(index);
  });

  // ////////////////////////////////////////////////////
  // Colors

  const { colors } = useTheme();

  const { colorMode } = useColorMode();

  let accentColor = colors.skeleton;
  if (accountImage) {
    accentColor = dominantColor || colors.appleBlue;
  } else if (typeof accountColor === 'number') {
    accentColor = colors.avatarBackgrounds[accountColor];
  }

  // ////////////////////////////////////////////////////
  // Animations

  const insets = useSafeAreaInsets();
  const position = useRecyclerAssetListPosition();
  const animatedStyle = React.useMemo(
    () => ({
      opacity: position!.interpolate({
        inputRange: [0, 1, navbarHeight + insets.top],
        outputRange: [1, 1, 0],
      }),
      transform: [
        {
          translateY: position!.interpolate({
            inputRange: [0, 1, navbarHeight + insets.top],
            outputRange: [0, 0, 12],
          }),
        },
        {
          scale: position!.interpolate({
            inputRange: [0, 1, navbarHeight + insets.top],
            outputRange: [1, 1, 0.5],
          }),
        },
      ],
    }),
    [insets.top, position]
  );

  const hasLoaded = Boolean(accountAddress && (accountSymbol || accountImage));

  const opacity = useDerivedValue(() => {
    return hasLoaded ? 1 : 0;
  });
  const fadeInStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: 100,
        easing: Easing.linear,
      }),
    };
  });

  const scale = useDerivedValue(() => {
    return hasLoaded ? 1 : 0.9;
  });
  const expandStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(scale.value, {
            damping: 12,
            restDisplacementThreshold: 0.001,
            restSpeedThreshold: 0.001,
            stiffness: 280,
          }),
        },
      ],
    };
  });

  return hasLoaded ? (
    <AccentColorProvider color={accentColor}>
      <RNAnimated.View style={[animatedStyle, { zIndex: 500 }]}>
        <Animated.View style={expandStyle}>
          <ContextMenuButton {...(contextMenuProps ?? {})}>
            <ButtonPressAnimation onPress={onAvatarPressProfile} scale={0.8} overflowMargin={20} testID="avatar-button">
              <Box
                alignItems="center"
                background="accent"
                borderRadius={size / 2}
                height={{ custom: size }}
                justifyContent="center"
                shadow={
                  hasLoaded
                    ? {
                        custom: {
                          ios: [
                            {
                              x: 0,
                              y: 2,
                              blur: 8,
                              opacity: 0.08,
                              color: 'shadowFar',
                            },
                            {
                              x: 0,
                              y: 8,
                              blur: 24,
                              opacity: 0.3,
                              color: colorMode === 'dark' ? 'shadowFar' : 'accent',
                            },
                          ],
                          android: {
                            elevation: 30,
                            opacity: 0.8,
                            color: colorMode === 'dark' ? 'shadowFar' : 'accent',
                          },
                        },
                      }
                    : undefined
                }
                style={{
                  backgroundColor: accountImage ? colors.skeleton : accentColor,
                }}
                width={{ custom: size }}
              >
                <Animated.View style={[fadeInStyle]}>
                  {accountImage ? (
                    <Box
                      as={ImgixImage}
                      borderRadius={size / 2}
                      height={{ custom: size }}
                      source={{ uri: accountImage }}
                      width={{ custom: size }}
                      size={100}
                    />
                  ) : (
                    <EmojiAvatar size={size} />
                  )}
                </Animated.View>
              </Box>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Animated.View>
      </RNAnimated.View>
    </AccentColorProvider>
  ) : (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Skeleton animated width={size}>
        <Box background="body (Deprecated)" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }} />
      </Skeleton>
    </Box>
  );
});

export const EmojiAvatar = React.memo(function EmojiAvatar({ size }: { size: number }) {
  const { colors } = useTheme();
  const { accountColor, accountSymbol } = useAccountProfileInfo();

  const accentColor = accountColor !== undefined ? colors.avatarBackgrounds[accountColor] : colors.skeleton;

  return (
    <AccentColorProvider color={accentColor}>
      <Box background="accent" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }}>
        <Cover alignHorizontal="center" alignVertical="center">
          <Box>
            <NativeText style={{ fontSize: ios ? 48 : 36, color: 'white' }}>
              {typeof accountSymbol === 'string' && getFirstGrapheme(accountSymbol.toUpperCase())}
            </NativeText>
          </Box>
        </Cover>
      </Box>
    </AccentColorProvider>
  );
});
