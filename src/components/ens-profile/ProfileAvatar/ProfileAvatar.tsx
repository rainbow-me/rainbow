import React from 'react';
import { Text as NativeText } from 'react-native';
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
          background={avatarUrl ? 'body' : 'accent'}
          borderRadius={size / 2}
          height={{ custom: size }}
          justifyContent="center"
          width={{ custom: size }}
        >
          {avatarUrl ? (
            <ImagePreviewOverlayTarget
              aspectRatioType="avatar"
              backgroundMask="avatar"
              borderRadius={size / 2}
              height={{ custom: size }}
              topOffset={ios ? 112 : 107}
            >
              <Box
                as={ImgixImage}
                height={{ custom: size }}
                source={{ uri: avatarUrl }}
              />
            </ImagePreviewOverlayTarget>
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
