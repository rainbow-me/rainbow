import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { Box, useForegroundColor } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

export default function ProfileCover({
  coverUrl,
}: {
  coverUrl?: string | null;
}) {
  const accentColor = useForegroundColor('accent');
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
            style: { backgroundColor: accentColor + '10' },
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
