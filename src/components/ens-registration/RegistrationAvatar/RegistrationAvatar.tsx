import ConditionalWrap from 'conditional-wrap';
import React, { useCallback, useEffect, useState } from 'react';
import { IS_TESTING } from 'react-native-dotenv';
import { Image } from 'react-native-image-crop-picker';
import { atom, useSetRecoilState } from 'recoil';
import ButtonPressAnimation from '../../animations/ButtonPressAnimation';
import Skeleton from '../../skeleton/Skeleton';
import AvatarCoverPhotoMaskSvg from '../../svg/AvatarCoverPhotoMaskSvg';
import { AccentColorProvider, BackgroundProvider, Box, Cover, Text, useForegroundColor } from '@/design-system';
import { UniqueAsset } from '@/entities';
import { UploadImageReturnData } from '@/handlers/pinata';
import { useENSModifiedRegistration, useENSRegistration, useENSRegistrationForm, useSelectImageMenu } from '@/hooks';
import { ImgixImage } from '@/components/images';
import { magicMemo, stringifyENSNFTRecord } from '@/utils';
import { ENS_RECORDS } from '@/helpers/ens';

export const avatarMetadataAtom = atom<Image | undefined>({
  default: undefined,
  key: 'ens.avatarMetadata',
});

const size = 70;
const isTesting = IS_TESTING === 'true';

const RegistrationAvatar = ({
  hasSeenExplainSheet,
  onChangeAvatarUrl,
  onShowExplainSheet,
  enableNFTs,
}: {
  hasSeenExplainSheet: boolean;
  onChangeAvatarUrl: (url: string) => void;
  onShowExplainSheet: () => void;
  enableNFTs: boolean;
}) => {
  const {
    images: { avatarUrl: initialAvatarUrl },
  } = useENSModifiedRegistration();
  const { isLoading, values, onBlurField, onRemoveField, setDisabled } = useENSRegistrationForm();
  const { name } = useENSRegistration();

  const [avatarUpdateAllowed, setAvatarUpdateAllowed] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || values?.avatar);
  useEffect(() => {
    if (avatarUpdateAllowed) {
      const avatarUrl = typeof initialAvatarUrl === 'string' ? initialAvatarUrl : values?.avatar;
      setAvatarUrl(avatarUrl);
      onChangeAvatarUrl(avatarUrl ?? '');
    }
  }, [initialAvatarUrl, avatarUpdateAllowed]); // eslint-disable-line react-hooks/exhaustive-deps

  // We want to allow avatar state update when the screen is first focussed.
  useEffect(() => setAvatarUpdateAllowed(true), [setAvatarUpdateAllowed, name]);

  const setAvatarMetadata = useSetRecoilState(avatarMetadataAtom);

  const accentColor = useForegroundColor('accent');

  const onChangeImage = useCallback(
    ({ asset, image }: { asset?: UniqueAsset; image?: Image & { tmpPath?: string } }) => {
      setAvatarMetadata(image);
      setAvatarUrl(image?.tmpPath || asset?.lowResUrl || asset?.image_thumbnail_url || '');
      onChangeAvatarUrl(image?.path || asset?.lowResUrl || asset?.image_thumbnail_url || '');
      if (asset) {
        const standard = asset.asset_contract?.schema_name || '';
        const contractAddress = asset.asset_contract?.address || '';
        const tokenId = asset.id;
        onBlurField({
          key: 'avatar',
          value: stringifyENSNFTRecord({
            contractAddress,
            standard,
            tokenId,
          }),
        });
      } else if (image?.tmpPath) {
        // We want to disallow future avatar state changes (i.e. when upload successful)
        // to avoid avatar flashing (from temp URL to uploaded URL).
        setAvatarUpdateAllowed(false);
        onBlurField({
          key: 'avatar',
          value: image.tmpPath,
        });
      }
    },
    [onBlurField, onChangeAvatarUrl, setAvatarMetadata]
  );

  const { ContextMenu, handleSelectImage, handleSelectNFT } = useSelectImageMenu({
    imagePickerOptions: {
      cropperCircleOverlay: true,
      cropping: true,
      height: 400,
      width: 400,
    },
    menuItems: enableNFTs ? ['library', 'nft'] : ['library'],
    onChangeImage,
    onRemoveImage: () => {
      onRemoveField({ key: ENS_RECORDS.avatar });
      onChangeAvatarUrl('');
      setAvatarMetadata(undefined);
      setDisabled(false);
      setTimeout(() => {
        setAvatarUrl('');
      }, 100);
    },
    onUploadError: () => {
      onBlurField({ key: 'avatar', value: '' });
      setAvatarUrl('');
    },
    onUploading: () => setDisabled(true),
    onUploadSuccess: ({ data }: { data: UploadImageReturnData }) => {
      onBlurField({ key: 'avatar', value: data.url });
      setDisabled(false);
    },
    showRemove: Boolean(avatarUrl),
    testID: 'avatar',
    uploadToIPFS: true,
  });

  return (
    <Box height={{ custom: size }} width={{ custom: size }}>
      <Cover alignHorizontal="center">
        <BackgroundProvider color="body (Deprecated)">
          {({ backgroundColor }) => <AvatarCoverPhotoMaskSvg backgroundColor={backgroundColor as any} />}
        </BackgroundProvider>
      </Cover>
      {isLoading ? (
        <Skeleton animated>
          <Box background="body (Deprecated)" borderRadius={size / 2} height={{ custom: size }} width={{ custom: size }} />
        </Skeleton>
      ) : (
        <ConditionalWrap
          condition={hasSeenExplainSheet && !isTesting && (enableNFTs || !!avatarUrl)}
          wrap={children => <ContextMenu>{children}</ContextMenu>}
        >
          <ButtonPressAnimation
            onPress={!hasSeenExplainSheet ? onShowExplainSheet : isTesting ? handleSelectNFT : enableNFTs ? undefined : handleSelectImage}
            testID="use-select-image-avatar"
          >
            <AccentColorProvider color={accentColor + '10'}>
              <Box
                alignItems="center"
                background={avatarUrl ? 'body (Deprecated)' : 'accent'}
                borderRadius={size / 2}
                height={{ custom: size }}
                justifyContent="center"
                shadow={avatarUrl ? '15px light (Deprecated)' : undefined}
                width={{ custom: size }}
              >
                {avatarUrl ? (
                  <Box
                    as={ImgixImage}
                    borderRadius={size / 2}
                    height={{ custom: size }}
                    source={{ uri: avatarUrl }}
                    width={{ custom: size }}
                    size={100}
                  />
                ) : (
                  <AccentColorProvider color={accentColor}>
                    <Text color="accent" size="18px / 27px (Deprecated)" weight="heavy">
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
};

export default magicMemo(RegistrationAvatar, ['hasSeenExplainSheet', 'onChangeAvatarUrl', 'onShowExplainSheet']);
