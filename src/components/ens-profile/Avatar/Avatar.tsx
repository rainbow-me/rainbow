import React from 'react';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Cover,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

const size = 70;

export default function Avatar({ avatarUrl }: { avatarUrl?: string | null }) {
  const accentColor = useForegroundColor('accent');

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body">
          {({ backgroundColor }) => (
            <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />
          )}
        </BackgroundProvider>
      </Cover>
      <AccentColorProvider color={accentColor + '10'}>
        <Box
          alignItems="center"
          background="accent"
          borderRadius={size / 2}
          height={{ custom: size }}
          justifyContent="center"
          shadow="12px heavy accent"
          width={{ custom: size }}
        >
          {avatarUrl && (
            <Box
              as={ImgixImage}
              borderRadius={size / 2}
              height={{ custom: size }}
              source={{ uri: avatarUrl }}
              width={{ custom: size }}
            />
          )}
        </Box>
      </AccentColorProvider>
    </Box>
  );
}
