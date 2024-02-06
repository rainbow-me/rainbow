import React from 'react';
import { Text as NativeText } from 'react-native';
import Animated from 'react-native-reanimated';
import { ImagePreviewOverlayTarget } from '../../images/ImagePreviewOverlay';
import Skeleton from '../../skeleton/Skeleton';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import { BackgroundProvider, Box, Cover } from '@/design-system';
import { useFadeImage } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { sharedCoolModalTopOffset } from '@/navigation/config';

const imagePreviewOverlayTopOffset = ios ? 68 + sharedCoolModalTopOffset : 107;
const size = 70;

export default function ProfileAvatar({
  accountSymbol,
  avatarUrl,
  enableZoomOnPress,
  handleOnPress,
  isFetched,
}: {
  accountSymbol?: string | null;
  avatarUrl?: string | null;
  enableZoomOnPress?: boolean;
  handleOnPress?: () => void;
  isFetched?: boolean;
}) {
  const { isLoading, onLoadEnd, style } = useFadeImage({
    enabled: isFetched,
    source: avatarUrl ? { uri: avatarUrl } : undefined,
  });

  const showAccentBackground = !avatarUrl && isFetched && !isLoading;
  const showSkeleton = isLoading || !isFetched;

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body (Deprecated)">
          {({ backgroundColor }) => <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />}
        </BackgroundProvider>
      </Cover>
      <Box
        alignItems="center"
        background={showAccentBackground ? 'accent' : 'body (Deprecated)'}
        borderRadius={size / 2}
        justifyContent="center"
        shadow="15px light (Deprecated)"
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
          imageUrl={avatarUrl || ''}
          onPress={handleOnPress}
          topOffset={imagePreviewOverlayTopOffset}
          zIndex={2}
        >
          <>
            {showSkeleton && (
              <Cover alignHorizontal="center">
                <Box height={{ custom: size }} width="full">
                  <Skeleton animated>
                    <Box background="body (Deprecated)" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }} />
                  </Skeleton>
                </Box>
              </Cover>
            )}
            <Animated.View style={style}>
              {avatarUrl ? (
                <Box
                  as={ImgixImage}
                  height={{ custom: size }}
                  onLoadEnd={onLoadEnd}
                  source={{ uri: avatarUrl }}
                  width={{ custom: size }}
                  size={100}
                />
              ) : (
                <Box background="accent" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }}>
                  <Cover alignHorizontal="center" alignVertical="center">
                    <Box>
                      <NativeText style={{ fontSize: 38 }}>{accountSymbol || ''}</NativeText>
                    </Box>
                  </Cover>
                </Box>
              )}
            </Animated.View>
          </>
        </ImagePreviewOverlayTarget>
      </Box>
    </Box>
  );
}
