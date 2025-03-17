import * as React from 'react';
import { Text as NativeText } from 'react-native';
import Animated, { clamp, Easing, interpolate, useAnimatedStyle, useDerivedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import Skeleton from '@/components/skeleton/Skeleton';
import { AccentColorProvider, Box, Cover, useColorMode } from '@/design-system';
import { useAccountProfile, useLatestCallback, useOnAvatarPress, withPerformanceTracking } from '@/hooks';
import { useTheme } from '@/theme';
import { getFirstGrapheme } from '@/utils';
import ContextMenu from '@/components/native-context-menu/contextMenu';
import { navbarHeight } from '@/components/navbar/Navbar';
import { usePersistentDominantColorFromImage } from '@/hooks/usePersistentDominantColorFromImage';
import { useScrollPosition } from './ScrollPositionContext';
import { ProfileStickyHeaderHeight } from '@/components/asset-list/RecyclerAssetList2/profile-header/ProfileStickyHeader';
export const ProfileAvatarRowHeight = 80;
export const ProfileAvatarRowTopInset = 24;
export const ProfileAvatarSize = 80;

function ProfileAvatarComponent({ size = ProfileAvatarSize }) {
  const { position } = useScrollPosition();

  const { accountSymbol, accountColor, accountImage } = useAccountProfile();

  const { avatarContextMenuConfig, onAvatarPressProfile, onSelectionCallback } = useOnAvatarPress({ screenType: 'wallet' });

  const dominantColor = usePersistentDominantColorFromImage(accountImage);

  const ContextMenuButton = onAvatarPressProfile ? React.Fragment : ContextMenu;

  const handlePressMenuItem = useLatestCallback((e: any) => {
    const index = avatarContextMenuConfig?.menuItems?.findIndex(item => item && item.actionKey === e.nativeEvent.actionKey);
    onSelectionCallback(index);
  });

  const { colors } = useTheme();
  const { colorMode } = useColorMode();

  const accentColor = React.useMemo(() => {
    if (accountImage) {
      return dominantColor || colors.appleBlue;
    } else if (typeof accountColor === 'number') {
      return colors.avatarBackgrounds[accountColor];
    }
    return colors.skeleton;
  }, [accountImage, accountColor, dominantColor, colors]);

  const animatedStyle = useAnimatedStyle(() => {
    const currentPosition = clamp(position.value, 0, navbarHeight);
    return {
      opacity: interpolate(currentPosition, [0, navbarHeight], [1, 0]),
      transform: [
        {
          translateY: interpolate(currentPosition, [0, navbarHeight], [0, 12]),
        },
        {
          scale: interpolate(currentPosition, [0, navbarHeight], [1, 0.5]),
        },
      ],
    };
  });

  const hasLoaded = accountSymbol || accountImage;

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

  return (
    <AccentColorProvider color={accentColor}>
      <Animated.View style={[animatedStyle, { zIndex: 500, marginTop: ProfileStickyHeaderHeight }]}>
        <Animated.View style={expandStyle}>
          <ContextMenuButton menuConfig={avatarContextMenuConfig} onPressMenuItem={handlePressMenuItem}>
            <ButtonPressAnimation onPress={onAvatarPressProfile} scale={0.8} testID="avatar-button" overflowMargin={20}>
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
                <>
                  {!hasLoaded && (
                    <Cover alignHorizontal="center">
                      <Box height={{ custom: size }} width="full">
                        <Skeleton animated>
                          <Box background="body (Deprecated)" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }} />
                        </Skeleton>
                      </Box>
                    </Cover>
                  )}
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
                </>
              </Box>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Animated.View>
      </Animated.View>
    </AccentColorProvider>
  );
}

export const ProfileAvatar = withPerformanceTracking(ProfileAvatarComponent);

export function EmojiAvatar({ size }: { size: number }) {
  const { colors } = useTheme();
  const { accountColor, accountSymbol } = useAccountProfile();

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
}
