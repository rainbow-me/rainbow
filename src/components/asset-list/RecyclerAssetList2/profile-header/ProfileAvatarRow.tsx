import * as React from 'react';
import { Animated as RNAnimated, Text as NativeText } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ButtonPressAnimation } from '@/components/animations';
import { ImgixImage } from '@/components/images';
import Skeleton from '@/components/skeleton/Skeleton';
import { AccentColorProvider, Box, Cover, useColorMode } from '@/design-system';
import { useLatestCallback, useOnAvatarPress } from '@/hooks';
import { useTheme } from '@/theme';
import { getFirstGrapheme } from '@/utils';
import ContextMenu from '@/components/native-context-menu/contextMenu';
import { useRecyclerAssetListPosition } from '../core/Contexts';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { navbarHeight } from '@/components/navbar/Navbar';
import { IS_ANDROID } from '@/env';

export const ProfileAvatarRowHeight = 80;
export const ProfileAvatarRowTopInset = 24;
export const ProfileAvatarSize = 80;

type Props = {
  size?: number;
  accountSymbol?: string | boolean;
  accountAccentColor: string;
  accountImage?: string | null;
  hasAccountAccentColorLoaded?: boolean;
};

export const ProfileAvatarRow: React.FC<Props> = ({
  size = ProfileAvatarSize,
  accountSymbol,
  accountAccentColor,
  hasAccountAccentColorLoaded,
  accountImage,
}) => {
  const {
    avatarContextMenuConfig,
    onAvatarPressProfile,
    onSelectionCallback,
  } = useOnAvatarPress({ screenType: 'wallet' });

  const ContextMenuButton = onAvatarPressProfile ? React.Fragment : ContextMenu;
  const handlePressMenuItem = useLatestCallback((e: any) => {
    const index = avatarContextMenuConfig.menuItems?.findIndex(
      item => item.actionKey === e.nativeEvent.actionKey
    );
    onSelectionCallback(index);
  });
  const { colors } = useTheme();
  const { colorMode } = useColorMode();

  const accentColor = hasAccountAccentColorLoaded
    ? accountAccentColor
    : colors.skeleton;

  const insets = useSafeAreaInsets();
  const position = useRecyclerAssetListPosition();

  const animatedStyle = React.useMemo(
    () => ({
      opacity: position!.interpolate({
        inputRange: [
          -insets.top,
          IS_ANDROID ? 0 : -insets.top + 1,
          navbarHeight + insets.top,
        ],
        outputRange: [1, 1, 0],
      }),
      transform: [
        {
          translateY: position!.interpolate({
            inputRange: [
              -insets.top,
              IS_ANDROID ? 0 : -insets.top + 1,
              navbarHeight + insets.top,
            ],
            outputRange: [0, 0, 12],
          }),
          scale: position!.interpolate({
            inputRange: [
              -insets.top,
              IS_ANDROID ? 0 : -insets.top + 1,
              navbarHeight + insets.top,
            ],
            outputRange: [1, 1, 0.8],
          }),
        },
      ],
    }),
    [position]
  );

  const opacity = useDerivedValue(() => {
    return hasAccountAccentColorLoaded ? 1 : 0;
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
    return hasAccountAccentColorLoaded ? 1 : 0.9;
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
      <RNAnimated.View style={animatedStyle}>
        <Animated.View style={[expandStyle]}>
          <ContextMenuButton
            // @ts-expect-error - JS component
            menuConfig={avatarContextMenuConfig}
            onPressMenuItem={handlePressMenuItem}
          >
            <ButtonPressAnimation
              onPress={onAvatarPressProfile}
              scale={0.8}
              testID="avatar-button"
              overflowMargin={20}
            >
              <Box
                alignItems="center"
                background="accent"
                borderRadius={size / 2}
                height={{ custom: size }}
                justifyContent="center"
                shadow={
                  hasAccountAccentColorLoaded
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
                              color:
                                colorMode === 'dark' ? 'shadowFar' : 'accent',
                            },
                          ],
                          android: {
                            elevation: 30,
                            opacity: 0.8,
                            color:
                              colorMode === 'dark' ? 'shadowFar' : 'accent',
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
                  {!hasAccountAccentColorLoaded && (
                    <Cover alignHorizontal="center">
                      <Box height={{ custom: size }} width="full">
                        <Skeleton animated>
                          <Box
                            background="body (Deprecated)"
                            borderRadius={size / 2}
                            height={{ custom: size }}
                            width={{ custom: size }}
                          />
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
                      />
                    ) : (
                      <EmojiAvatar
                        accountAccentColor={accountAccentColor}
                        accountSymbol={accountSymbol}
                        size={size}
                      />
                    )}
                  </Animated.View>
                </>
              </Box>
            </ButtonPressAnimation>
          </ContextMenuButton>
        </Animated.View>
      </RNAnimated.View>
    </AccentColorProvider>
  );
};

export function EmojiAvatar({
  size,
  accountAccentColor,
  accountSymbol,
}: {
  size: number;
  accountAccentColor: string;
  accountSymbol?: string | boolean;
}) {
  return (
    <AccentColorProvider color={accountAccentColor}>
      <Box
        background="accent"
        borderRadius={size / 2}
        height={{ custom: size }}
        width={{ custom: size }}
      >
        <Cover alignHorizontal="center" alignVertical="center">
          <Box>
            <NativeText style={{ fontSize: ios ? 48 : 36, color: 'white' }}>
              {typeof accountSymbol === 'string' &&
                getFirstGrapheme(accountSymbol.toUpperCase())}
            </NativeText>
          </Box>
        </Cover>
      </Box>
    </AccentColorProvider>
  );
}
