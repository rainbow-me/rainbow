import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import Animated from 'react-native-reanimated';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import Skeleton from '../../skeleton/Skeleton';
import { Box, useForegroundColor } from '@rainbow-me/design-system';
import { useFadeImage } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { sharedCoolModalTopOffset } from '@rainbow-me/navigation/config';

const imagePreviewOverlayTopOffset = ios ? 68 + sharedCoolModalTopOffset : 107;

export default function ProfileCover({
  coverUrl,
  enableZoomOnPress,
  handleOnPress,
  isFetched,
}: {
  coverUrl?: string | null;
  enableZoomOnPress?: boolean;
  handleOnPress?: () => void;
  isFetched: boolean;
}) {
  const accentColor = useForegroundColor('accent');

  const { isLoading, onLoadEnd, style } = useFadeImage({
    enabled: isFetched,
    source: coverUrl ? { uri: coverUrl } : undefined,
  });

  const showSkeleton = isLoading || !isFetched;
  const showRadialGradient = ios && !coverUrl && isFetched && !isLoading;

  return (
    <>
      {showSkeleton && (
        <Box height="126px" position="absolute" top="0px" width="full">
          <Skeleton animated>
            <Box background="body" height="126px" width="full" />
          </Skeleton>
        </Box>
      )}
      <Animated.View style={style}>
        <Box
          alignItems="center"
          as={showRadialGradient ? RadialGradient : View}
          height="126px"
          justifyContent="center"
          {...(showRadialGradient
            ? {
                center: [0, 126],
                colors: [accentColor, accentColor + '60'],
                stops: [0, 1],
              }
            : {
                ...(showSkeleton
                  ? {}
                  : coverUrl
                  ? {
                      background: 'body',
                    }
                  : {
                      style: { backgroundColor: accentColor },
                    }),
              })}
        >
          <ImagePreviewOverlayTarget
            aspectRatioType="cover"
            borderRadius={0}
            // Defer mounting of overlay component to avoid avatar flickers
            deferOverlayTimeout={1000}
            disableEnteringWithPinch
            enableZoomOnPress={enableZoomOnPress}
            height="126px"
            hideStatusBar={false}
            imageUrl={coverUrl || ''}
            onPress={handleOnPress}
            topOffset={imagePreviewOverlayTopOffset}
          >
            <Box
              as={ImgixImage}
              height="126px"
              onLoadEnd={onLoadEnd}
              source={{ uri: coverUrl || '' }}
            />
          </ImagePreviewOverlayTarget>
        </Box>
      </Animated.View>
    </>
  );
}
