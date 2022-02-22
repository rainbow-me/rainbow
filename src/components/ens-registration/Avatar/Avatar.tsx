import React, { useEffect, useState } from 'react';
import Svg, { Path } from 'react-native-svg';
import Spinner from '../../Spinner';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import {
  useENSProfile,
  useENSProfileForm,
  useSelectImageMenu,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { stringifyENSNFTAvatar } from '@rainbow-me/utils';

const size = 70;

export default function Avatar({
  onChangeAvatarUrl,
}: {
  onChangeAvatarUrl: (url: string) => void;
}) {
  const { avatarUrl: initialAvatarUrl } = useENSProfile();
  const { onBlurField, setDisabled } = useENSProfileForm();

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  useEffect(() => {
    setAvatarUrl(initialAvatarUrl);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const accentColor = useForegroundColor('accent');

  const { ContextMenu, isUploading } = useSelectImageMenu({
    imagePickerOptions: {
      cropperCircleOverlay: true,
      cropping: true,
    },
    menuItems: ['library', 'nft'],
    onChangeImage: ({ asset, image }) => {
      setAvatarUrl(image?.path || asset?.image_thumbnail_url);
      onChangeAvatarUrl(image?.path || asset?.image_thumbnail_url || '');
      if (asset) {
        const standard = asset.asset_contract?.schema_name;
        const contractAddress = asset.asset_contract?.address;
        const tokenId = asset.id;
        onBlurField({
          key: 'avatar',
          value: stringifyENSNFTAvatar({
            contractAddress,
            standard,
            tokenId,
          }),
        });
      }
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
            <Svg height="32" style={{ top: -6 }} viewBox="0 0 96 29" width="96">
              <Path
                d="M9.22449 23.5H0V28.5H96V23.5H86.7755C85.0671 23.5 83.4978 22.5584 82.6939 21.051C67.8912 -6.70409 28.1088 -6.70408 13.3061 21.051C12.5022 22.5584 10.9329 23.5 9.22449 23.5Z"
                fill={backgroundColor as any}
              />
            </Svg>
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
