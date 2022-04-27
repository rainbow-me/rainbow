import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import Skeleton from '../../skeleton/Skeleton';
import { Box, useForegroundColor } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

export default function ProfileCover({
  coverUrl,
  isLoading,
}: {
  coverUrl?: string | null;
  isLoading?: boolean;
}) {
  const accentColor = useForegroundColor('accent');

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
          height="126px"
          hideStatusBar={false}
          topOffset={ios ? 112 : 107}
        >
          <Box as={ImgixImage} height="126px" source={{ uri: coverUrl }} />
        </ImagePreviewOverlayTarget>
      )}
    </Box>
  );
}
