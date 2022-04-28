import React, { useCallback } from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import Skeleton from '../../skeleton/Skeleton';
import { Box, useForegroundColor } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

export default function ProfileCover({
  coverUrl,
  isLoading,
  enableZoomOnPress,
  handleOnPress,
}: {
  coverUrl?: string | null;
  isLoading?: boolean;
  enableZoomOnPress?: boolean;
  handleOnPress?: () => void;
}) {
  const accentColor = useForegroundColor('accent');

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

  if (isLoading) {
    return (
      <Box height="126px">
        <Skeleton animated>
          <Box background="body" height="126px" width="full" />
        </Skeleton>
      </Box>
    );
  }
  return (
    <Box
      alignItems="center"
      as={ios && !coverUrl ? RadialGradient : View}
      height="126px"
      justifyContent="center"
      {...(ios
        ? {
            center: [0, 126],
            colors: [accentColor, accentColor + '60'],
            stops: [0, 1],
          }
        : {
            ...(coverUrl
              ? {
                  background: 'body',
                }
              : {
                  style: { backgroundColor: accentColor },
                }),
          })}
    >
      {coverUrl && (
        <ImagePreviewOverlayTarget
          aspectRatioType="cover"
          borderRadius={0}
          disableEnteringWithPinch
          enableZoomOnPress={enableZoomOnPress}
          height="126px"
          hideStatusBar={false}
          imageUrl={coverUrl}
          onPress={handleOnPress}
          topOffset={ios ? 112 : 107}
        >
          <Animated.View style={style}>
            <Box
              as={ImgixImage}
              height="126px"
              onLoadEnd={onLoadEnd}
              source={{ uri: coverUrl }}
            />
          </Animated.View>
        </ImagePreviewOverlayTarget>
      )}
    </Box>
  );
}
