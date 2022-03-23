import ConditionalWrap from 'conditional-wrap';
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native-image-crop-picker';
import { atom, useSetRecoilState } from 'recoil';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton from '../../skeleton/Skeleton';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import {
  AccentColorProvider,
  BackgroundProvider,
  Box,
  Cover,
  Text,
  useForegroundColor,
} from '@rainbow-me/design-system';
import {
  useENSRegistration,
  useENSRegistrationForm,
  useSelectImageMenu,
} from '@rainbow-me/hooks';
import { ImgixImage } from '@rainbow-me/images';
import { stringifyENSNFTAvatar } from '@rainbow-me/utils';

export const avatarMetadataAtom = atom<Image | undefined>({
  default: undefined,
  key: 'ens.avatarMetadata',
});

const size = 70;

export default function RegistrationAvatar({
  hasSeenExplainSheet,
  onChangeAvatarUrl,
  onShowExplainSheet,
}: {
  hasSeenExplainSheet: boolean;
  onChangeAvatarUrl: (url: string) => void;
  onShowExplainSheet: () => void;
}) {
  const {
    images: { avatarUrl: initialAvatarUrl },
  } = useENSRegistration();
  const { isLoading, values, onBlurField } = useENSRegistrationForm();

  const [avatarUrl, setAvatarUrl] = useState(
    initialAvatarUrl || values?.avatar
  );
  useEffect(() => {
    setAvatarUrl(initialAvatarUrl || values?.avatar);
  }, [initialAvatarUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const setAvatarMetadata = useSetRecoilState(avatarMetadataAtom);

  const accentColor = useForegroundColor('accent');

  const { ContextMenu } = useSelectImageMenu({
    imagePickerOptions: {
      cropperCircleOverlay: true,
      cropping: true,
    },
    menuItems: ['library', 'nft'],
    onChangeImage: ({ asset, image }) => {
      setAvatarMetadata(image);
      setAvatarUrl(image?.tmpPath || asset?.image_thumbnail_url || '');
      onChangeAvatarUrl(image?.tmpPath || asset?.image_thumbnail_url || '');
      if (asset) {
        const standard = asset.asset_contract?.schema_name || '';
        const contractAddress = asset.asset_contract?.address || '';
        const tokenId = asset.id;
        onBlurField({
          key: 'avatar',
          value: stringifyENSNFTAvatar({
            contractAddress,
            standard,
            tokenId,
          }),
        });
      } else if (image?.tmpPath) {
        onBlurField({
          key: 'avatar',
          value: image.tmpPath,
        });
      }
    },
    onUploadError: () => {
      onBlurField({ key: 'avatar', value: '' });
      setAvatarUrl('');
    },
    onUploadSuccess: ({ data }) => {
      onBlurField({ key: 'avatar', value: data.url });
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
      {isLoading ? (
        <Skeleton animated>
          <Box
            background="body"
            borderRadius={size / 2}
            height={{ custom: size }}
            width={{ custom: size }}
          />
        </Skeleton>
      ) : (
        <ConditionalWrap
          condition={hasSeenExplainSheet}
          wrap={children => <ContextMenu>{children}</ContextMenu>}
        >
          <ButtonPressAnimation
            onPress={!hasSeenExplainSheet ? onShowExplainSheet : undefined}
          >
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
                  <Box
                    as={ImgixImage}
                    borderRadius={size / 2}
                    height={{ custom: size }}
                    source={{ uri: avatarUrl }}
                    width={{ custom: size }}
                  />
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
        </ConditionalWrap>
      )}
    </Box>
  );
}
