import React from 'react';
import { View } from 'react-native';
import RadialGradient from 'react-native-radial-gradient';
import { Box, useForegroundColor } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

export default function Cover({ coverUrl }: { coverUrl?: string | null }) {
  const accentColor = useForegroundColor('accent');
  return (
    <Box
      alignItems="center"
      as={ios ? RadialGradient : View}
      height="126px"
      justifyContent="center"
      {...(ios
        ? {
            center: [80, 100],
            colors: [accentColor + '33', accentColor + '10'],
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
