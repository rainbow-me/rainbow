import React, { useCallback } from 'react';
import { Text as NativeText } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import Skeleton from '../../skeleton/Skeleton';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import { BackgroundProvider, Box, Cover } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';
const size = 70;

export default function ProfileAvatar({
  accountSymbol,
  avatarUrl,
  isLoading,
  enableZoomOnPress,
  handleOnPress,
}: {
  accountSymbol?: string | null;
  avatarUrl?: string | null;
  isLoading?: boolean;
  enableZoomOnPress?: boolean;
  handleOnPress?: () => void;
}) {
  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    return {
      opacity: withTiming(opacity.value, {
        duration: 500,
        easing: Easing.linear,
      }),
    };
  });

  const onLoadEnd = useCallback(() => {
    opacity.value = 1;
  }, [opacity]);

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body">
          {({ backgroundColor }) => (
            <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />
          )}
        </BackgroundProvider>
      </Cover>
      {isLoading ? (
        <Box height={{ custom: size }}>
          <Skeleton animated>
            <Box
              background="body"
              borderRadius={size / 2}
              height={{ custom: size }}
              width={{ custom: size }}
            />
          </Skeleton>
        </Box>
      ) : (
        <Box
          alignItems="center"
          background={avatarUrl ? 'body' : 'accent'}
          borderRadius={size / 2}
          justifyContent="center"
          width={{ custom: size }}
        >
          {avatarUrl ? (
            <Animated.View style={style}>
              <ImagePreviewOverlayTarget
                aspectRatioType="avatar"
                backgroundMask="avatar"
                borderRadius={size / 2}
                enableZoomOnPress={enableZoomOnPress}
                height={{ custom: size }}
                onPress={handleOnPress}
                topOffset={ios ? 112 : 107}
              >
                <Box
                  as={ImgixImage}
                  height={{ custom: size }}
                  onLoadEnd={onLoadEnd}
                  source={{ uri: avatarUrl }}
                  width={{ custom: size }}
                />
              </ImagePreviewOverlayTarget>
            </Animated.View>
          ) : (
            <NativeText style={{ fontSize: 38 }}>
              {accountSymbol || ''}
            </NativeText>
          )}
        </Box>
      )}
    </Box>
  );
}
