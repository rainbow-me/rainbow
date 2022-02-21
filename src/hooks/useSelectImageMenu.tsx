import React, { useCallback } from 'react';
import ImagePicker, { Image, Options } from 'react-native-image-crop-picker';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { useMutation } from 'react-query';
import {
  uploadImage,
  UploadImageReturnData,
} from '@rainbow-me/handlers/pinata';

type Action = 'library' | 'nft';

const items = {
  library: {
    actionKey: 'library',
    actionTitle: 'Upload photo',
    icon: {
      imageValue: {
        systemName: 'photo',
      },
      type: 'IMAGE_SYSTEM',
    },
  },
  nft: {
    actionKey: 'nft',
    actionTitle: 'Choose NFT',
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
  onChangeImage?: ({ image }: { image: Image }) => void;
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
  const { isLoading: isUploading, mutateAsync: upload } = useMutation(
    'ensImageUpload',
    uploadImage
  );

  const handleSelectImage = useCallback(async () => {
    const image = await ImagePicker.openPicker({
      ...imagePickerOptions,
      includeBase64: true,
      mediaType: 'photo',
    });
    onChangeImage?.({ image });

    if (uploadToIPFS && image.filename && image.data) {
      onUploading?.({ image });
      try {
        const data = await upload({
          filename: image.filename,
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
    upload,
    uploadToIPFS,
  ]);

  const handlePressMenuItem = useCallback(
    ({ nativeEvent: { actionKey } }) => {
      if (actionKey === 'library') {
        handleSelectImage();
      }
    },
    [handleSelectImage]
  );

  const ContextMenu = useCallback(
    ({ children }) => (
      <ContextMenuButton
        enableContextMenu
        menuConfig={{
          menuItems: menuItems.map(item => items[item]) as any,
          menuTitle: '',
        }}
        {...(android ? { onPress: () => {} } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        useActionSheetFallback={false}
      >
        {children}
      </ContextMenuButton>
    ),
    [handlePressMenuItem, menuItems]
  );

  return { ContextMenu, isUploading };
}
