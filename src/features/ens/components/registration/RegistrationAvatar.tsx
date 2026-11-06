import React, { useCallback, useEffect, useState } from 'react';

import ConditionalWrap from 'conditional-wrap';

import { ButtonPressAnimation } from '@/components/animations/ButtonPressAnimation';
import { ImgixImage } from '@/components/images';
import Skeleton from '@/components/skeleton/Skeleton';
import { AvatarCoverPhotoMaskSvg } from '@/components/svg/AvatarCoverPhotoMaskSvg';
import { AccentColorProvider, BackgroundProvider, Box, Cover, Text, useForegroundColor } from '@/design-system';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { IS_TEST } from '@/env';
import { ENS_RECORDS } from '@/features/ens/core/records';
import { type UploadImageReturnData } from '@/handlers/pinata';
import useSelectImageMenu from '@/hooks/useSelectImageMenu';
import magicMemo from '@/utils/magicMemo';

import { nftImageRecord } from '../../core/nftRecord';
import useENSRegistrationForm from '../../hooks/useENSRegistrationForm';
import { useENSRegistrationImage } from '../../hooks/useENSRegistrationImage';

const size = 70;

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
  const initialAvatarUrl = useENSRegistrationImage('avatar');
  const { isLoading, values, onChangeField, onRemoveField, setUploading } = useENSRegistrationForm();
  const accentColor = useForegroundColor('accent');

  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl || values.avatar);

  useEffect(() => {
    const avatarUrl = initialAvatarUrl ?? values.avatar;
    setAvatarUrl(avatarUrl);
    onChangeAvatarUrl(avatarUrl ?? '');
  }, [initialAvatarUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const onSelectNft = useCallback(
    ({ asset }: { asset?: UniqueAsset }) => {
      if (!asset) return;
      const value = nftImageRecord(asset);
      if (!value) return;

      const preview = asset.images.lowResUrl || asset.images.highResUrl || '';
      setAvatarUrl(preview);
      onChangeAvatarUrl(preview);
      onChangeField({ key: 'avatar', value });
    },
    [onChangeField, onChangeAvatarUrl]
  );

  const { ContextMenu, handleSelectImage, handleSelectNFT } = useSelectImageMenu({
    imagePickerOptions: {
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
      width: 400,
      height: 400,
    },
    menuItems: enableNFTs ? ['library', 'nft'] : ['library'],
    onChangeImage: onSelectNft,
    onRemoveImage: () => {
      onRemoveField({ key: ENS_RECORDS.avatar });
      onChangeAvatarUrl('');
      setTimeout(() => {
        setAvatarUrl('');
      }, 100);
    },
    onUploadError: () => {
      onChangeField({ key: 'avatar', value: '' });
      setAvatarUrl('');
    },
    onUploading: uploading => setUploading('avatar', uploading),
    onUploadSuccess: ({ data }: { data: UploadImageReturnData }) => {
      onChangeField({ key: 'avatar', value: data.url });
    },
    showRemove: Boolean(avatarUrl),
    uploadToIPFS: true,
  });

  const showMenu = hasSeenExplainSheet && !IS_TEST && (enableNFTs || !!avatarUrl);

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
        <ConditionalWrap condition={showMenu} wrap={children => <ContextMenu testID="use-select-image-avatar">{children}</ContextMenu>}>
          <ButtonPressAnimation
            onPress={!hasSeenExplainSheet ? onShowExplainSheet : IS_TEST ? handleSelectNFT : showMenu ? undefined : handleSelectImage}
            testID={showMenu ? undefined : 'use-select-image-avatar'}
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
