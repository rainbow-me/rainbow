import lang from 'i18n-js';
import React, { useCallback } from 'react';
import { Image, Options } from 'react-native-image-crop-picker';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { useMutation } from 'react-query';
import { useImagePicker } from '.';
import { UniqueAsset } from '@rainbow-me/entities';
import {
  uploadImage,
  UploadImageReturnData,
} from '@rainbow-me/handlers/pinata';
import { useNavigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';
import { showActionSheetWithOptions } from '@rainbow-me/utils';

type Action = 'library' | 'nft';

const items = {
  library: {
    actionKey: 'library',
    actionTitle: lang.t('profiles.create.upload_photo'),
    icon: {
      imageValue: {
        systemName: 'photo',
      },
      type: 'IMAGE_SYSTEM',
    },
  },
  nft: {
    actionKey: 'nft',
    actionTitle: lang.t('profiles.create.choose_nft'),
    icon: {
      imageValue: {
        systemName: 'cube',
      },
      type: 'IMAGE_SYSTEM',
    },
  },
};

export default function useSelectImageMenu({
  imagePickerOptions,
  menuItems = ['library'],
  onChangeImage,
  onUploading,
  onUploadSuccess,
  onUploadError,
  uploadToIPFS = false,
}: {
  imagePickerOptions?: Options;
  menuItems?: Action[];
  onChangeImage?: ({
    asset,
    image,
  }: {
    asset?: UniqueAsset;
    image?: Image & { tmpPath?: string };
  }) => void;
  onUploading?: ({ image }: { image: Image }) => void;
  onUploadSuccess?: ({
    data,
    image,
  }: {
    data: UploadImageReturnData;
    image: Image;
  }) => void;
  onUploadError?: ({ error, image }: { error: unknown; image: Image }) => void;
  uploadToIPFS?: boolean;
} = {}) {
  const { navigate } = useNavigation();
  const { openPicker } = useImagePicker();
  const { isLoading: isUploading, mutateAsync: upload } = useMutation(
    'ensImageUpload',
    uploadImage
  );

  const handleSelectImage = useCallback(async () => {
    const image = await openPicker({
      ...imagePickerOptions,
      includeBase64: true,
      mediaType: 'photo',
    });
    if (!image) return;
    const stringIndex = image?.path.indexOf('/tmp');
    const tmpPath = `~${image?.path.slice(stringIndex)}`;

    onChangeImage?.({ image: { ...image, tmpPath } });

    if (uploadToIPFS) {
      onUploading?.({ image });
      try {
        const data = await upload({
          filename: image.filename || '',
          mime: image.mime,
          path: image.path,
        });
        onUploadSuccess?.({ data, image });
      } catch (err) {
        onUploadError?.({ error: err, image });
      }
    }
  }, [
    imagePickerOptions,
    onChangeImage,
    onUploadError,
    onUploadSuccess,
    onUploading,
    openPicker,
    upload,
    uploadToIPFS,
  ]);

  const handleSelectNFT = useCallback(() => {
    navigate(Routes.SELECT_UNIQUE_TOKEN_SHEET, {
      onSelect: (asset: any) => onChangeImage?.({ asset }),
      springDamping: 1,
      topOffset: 0,
    });
  }, [navigate, onChangeImage]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'library') {
        handleSelectImage();
      }
      if (actionKey === 'nft') {
        handleSelectNFT();
      }
    },
    [handleSelectImage, handleSelectNFT]
  );

  const handleAndroidPress = useCallback(() => {
    const actionSheetOptions = menuItems
      .map(item => items[item]?.actionTitle)
      .filter(x => x) as any;

    showActionSheetWithOptions(
      {
        options: actionSheetOptions,
      },
      async (buttonIndex: Number) => {
        if (buttonIndex === 0) {
          handleSelectImage();
        } else if (buttonIndex === 1) {
          handleSelectImage();
        }
      }
    );
  }, [handleSelectImage, menuItems]);

  const ContextMenu = useCallback(
    ({ children }) => (
      <ContextMenuButton
        enableContextMenu
        menuConfig={{
          menuItems: menuItems.map(item => items[item]) as any,
          menuTitle: '',
        }}
        {...(android ? { onPress: handleAndroidPress } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
      >
        {children}
      </ContextMenuButton>
    ),
    [handleAndroidPress, handlePressMenuItem, menuItems]
  );

  return { ContextMenu, isUploading };
}
