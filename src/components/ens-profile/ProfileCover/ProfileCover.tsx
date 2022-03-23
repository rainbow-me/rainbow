import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
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
      as={ios ? RadialGradient : View}
      height="126px"
      justifyContent="center"
      {...(ios
        ? {
            center: [0, 200],
            colors: [accentColor, accentColor + '50'],
            stops: [0, 1],
          }
        : {
            style: { backgroundColor: accentColor },
          })}
    >
      {coverUrl && (
        <Box
          as={ImgixImage}
          height="126px"
          source={{ uri: coverUrl }}
          width="full"
        />
      )}
    </Box>
  );
}
