import React, { useEffect, useState } from 'react';
import Spinner from '../../Spinner';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import { useENSProfileForm, useSelectImageMenu } from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';

const size = 70;

export default function Avatar({
  onChangeAvatarUrl,
}: {
  onChangeAvatarUrl: (url: string) => void;
}) {
  const { values, onBlurField, setDisabled } = useENSProfileForm();

  const [avatarUrl, setAvatarUrl] = useState(values?.avatar);
  useEffect(() => {
    setAvatarUrl(values?.avatar);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const accentColor = useForegroundColor('accent');

  const { ContextMenu, isUploading } = useSelectImageMenu({
    imagePickerOptions: {
      cropperCircleOverlay: true,
      cropping: true,
    },
    menuItems: ['library'],
    onChangeImage: ({ image }) => {
      setAvatarUrl(image.path);
      onChangeAvatarUrl(image.path);
    },
    onUploadError: () => {
      onBlurField({ key: 'avatar', value: '' });
      setAvatarUrl('');
      setDisabled(false);
    },
    onUploading: ({ image }) => {
      onBlurField({ key: 'avatar', value: image.path });
      setDisabled(true);
    },
    onUploadSuccess: ({ data }) => {
      onBlurField({ key: 'avatar', value: data.url });
      setDisabled(false);
    },
    uploadToIPFS: true,
  });

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body">
          {({ backgroundColor }) => (
            <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />
          )}
        </BackgroundProvider>
      </Cover>
      <ContextMenu>
        <ButtonPressAnimation>
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
              {avatarUrl ? (
                <>
                  <Box
                    as={ImgixImage}
                    borderRadius={size / 2}
                    height={{ custom: size }}
                    source={{ uri: avatarUrl }}
                    style={{
                      opacity: isUploading ? 0.3 : 1,
                    }}
                    width={{ custom: size }}
                  />
                  {isUploading && (
                    <Cover alignHorizontal="center" alignVertical="center">
                      <Spinner
                        color={accentColor}
                        duration={1000}
                        size={'large' as 'large'}
                      />
                    </Cover>
                  )}
                </>
              ) : (
                <AccentColorProvider color={accentColor}>
                  <Text color="accent" size="18px" weight="heavy">
                    {` 􀣵 `}
                  </Text>
                </AccentColorProvider>
              )}
            </Box>
          </AccentColorProvider>
        </ButtonPressAnimation>
      </ContextMenu>
    </Box>
  );
}
