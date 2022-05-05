import React, { useCallback, useContext, useEffect } from 'react';
import { Text as NativeText } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ProfileSheetConfigContext } from '../../../screens/ProfileSheet';
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
  const { shouldFadeImages } = useContext(ProfileSheetConfigContext);

  const opacity = useSharedValue(0);

  const style = useAnimatedStyle(() => {
    if (!shouldFadeImages) {
      return {
        opacity: 1,
      };
    }
    return {
      opacity: withTiming(opacity.value, {
        duration: 200,
        easing: Easing.linear,
      }),
    };
  });

  useEffect(() => {
    if (!avatarUrl) {
      opacity.value = 1;
    }
  }, [avatarUrl, opacity]);

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
      ) : !avatarUrl ? (
        <Animated.View style={style}>
          <Box height={{ custom: size }}>
            <Box
              background="accent"
              borderRadius={size / 2}
              height={{ custom: size }}
              width={{ custom: size }}
            >
              <Cover alignHorizontal="center" alignVertical="center">
                <Box>
                  <NativeText style={{ fontSize: 38 }}>
                    {accountSymbol || ''}
                  </NativeText>
                </Box>
              </Cover>
            </Box>
          </Box>
        </Animated.View>
      ) : (
        <Animated.View style={style}>
          <Box
            alignItems="center"
            background={avatarUrl ? 'body' : 'accent'}
            borderRadius={size / 2}
            justifyContent="center"
            shadow="15px light"
            width={{ custom: size }}
          >
            <ImagePreviewOverlayTarget
              aspectRatioType="avatar"
              backgroundMask="avatar"
              borderRadius={size / 2}
              disableEnteringWithPinch
              enableZoomOnPress={enableZoomOnPress}
              height={{ custom: size }}
              hideStatusBar={false}
              imageUrl={avatarUrl}
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
          </Box>
        </Animated.View>
      )}
    </Box>
  );
}
