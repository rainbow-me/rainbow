import React from 'react';
import { Text as NativeText } from 'react-native';
import Skeleton from '../../skeleton/Skeleton';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import { BackgroundProvider, Box, Cover } from '@rainbow-me/design-system';
import { ImgixImage } from '@rainbow-me/images';

const size = 70;

export default function ProfileAvatar({
  accountSymbol,
  avatarUrl,
  isLoading,
}: {
  accountSymbol?: string | null;
  avatarUrl?: string | null;
  isLoading?: boolean;
}) {
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
          background="accent"
          borderRadius={size / 2}
          height={{ custom: size }}
          justifyContent="center"
          shadow="12px heavy accent"
          width={{ custom: size }}
        >
          {avatarUrl ? (
            <Box
              as={ImgixImage}
              borderRadius={size / 2}
              height={{ custom: size }}
              source={{ uri: avatarUrl }}
              width={{ custom: size }}
            />
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
