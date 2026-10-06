import React, { useCallback, useMemo, useRef } from 'react';

import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { type ImagePickerAsset } from 'expo-image-picker';

import ContextMenuButton from '@/components/native-context-menu/contextMenu';
import type { UniqueAsset } from '@/entities/uniqueAssets';
import { uploadImage, type UploadImageReturnData } from '@/handlers/pinata';
import * as i18n from '@/languages';
import { useNavigation } from '@/navigation/Navigation';
import Routes from '@/navigation/routesNames';

import useImagePicker, { type ImagePickerOptions } from './useImagePicker';

type Action = 'library' | 'nft';

const items = {
  library: {
    actionKey: 'library',
    get actionTitle() {
      return i18n.t(i18n.l.profiles.create.upload_photo);
    },
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'photo.on.rectangle.angled',
    },
  },
  nft: {
    actionKey: 'nft',
    get actionTitle() {
      return i18n.t(i18n.l.profiles.create.choose_nft);
    },
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'square.grid.2x2',
    },
  },
  remove: {
    actionKey: 'remove',
    get actionTitle() {
      return i18n.t(i18n.l.profiles.create.remove);
    },
    icon: {
      iconType: 'SYSTEM',
      iconValue: 'trash',
    },
    menuAttributes: ['destructive'],
  },
} as const;

export default function useSelectImageMenu({
  imagePickerOptions,
  menuItems: initialMenuItems = ['library'],
  onChangeImage,
  onRemoveImage,
  onUploading,
  onUploadSuccess,
  onUploadError,
  showRemove = false,
  uploadToIPFS = false,
}: {
  imagePickerOptions?: ImagePickerOptions;
  menuItems?: Action[];
  onChangeImage?: ({ asset, image }: { asset?: UniqueAsset; image?: ImagePickerAsset }) => void;
  onRemoveImage?: () => void;
  onUploading?: ({ image }: { image: ImagePickerAsset }) => void;
  onUploadSuccess?: ({ data, image }: { data: UploadImageReturnData; image: ImagePickerAsset }) => void;
  onUploadError?: ({ error, image }: { error: unknown; image: ImagePickerAsset }) => void;
  showRemove?: boolean;
  uploadToIPFS?: boolean;
} = {}) {
  const { navigate, getParent: dangerouslyGetParent } = useNavigation();
  const { openPicker } = useImagePicker();
  const { isLoading: isUploading, mutateAsync: upload } = useMutation(['ensImageUpload'], uploadImage);

  // If the image is removed while uploading, we don't want to
  // call `onUploadSuccess` when the upload has finished.
  const isRemoved = useRef<boolean>(false);

  // When this hook is inside a nested navigator, the child
  // navigator will still think it is focused. Here, we are
  // also checking if the parent has not been dismissed too.
  const isFocused = useRef<boolean>(undefined);
  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;
      const dismiss = () => (isFocused.current = false);
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"dismiss"' is not assignable to ... Remove this comment to see the full error message
      dangerouslyGetParent()?.addListener('dismiss', dismiss);
      return () => {
        isFocused.current = false;
        // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"dismiss"' is not assignable to ... Remove this comment to see the full error message
        dangerouslyGetParent()?.removeListener('dismiss', dismiss);
      };
    }, [dangerouslyGetParent])
  );

  const menuItems = useMemo(
    () => (showRemove ? [...initialMenuItems, 'remove' as const] : initialMenuItems),
    [initialMenuItems, showRemove]
  );

  const handleSelectImage = useCallback(async () => {
    const image = await openPicker({
      ...imagePickerOptions,
      mediaTypes: 'images',
    });
    if (!image) return;

    if (uploadToIPFS) {
      onUploading?.({ image });
      try {
        const splitPath = image.uri.split('/');
        const filename = image.fileName || splitPath[splitPath.length - 1] || '';
        const data = await upload({
          filename,
          mime: image.mimeType || '',
          path: image.uri.replace('file://', ''),
        });
        if (!isFocused.current || isRemoved.current) return;
        onUploadSuccess?.({ data, image });
      } catch (err) {
        if (!isFocused.current || isRemoved.current) return;
        onUploadError?.({ error: err, image });
      }
    } else {
      onChangeImage?.({ image });
    }
  }, [imagePickerOptions, isRemoved, onChangeImage, onUploadError, onUploadSuccess, onUploading, openPicker, upload, uploadToIPFS]);

  const handleSelectNFT = useCallback(() => {
    navigate(Routes.SELECT_UNIQUE_TOKEN_SHEET, {
      onSelect: asset => onChangeImage?.({ asset }),
      springDamping: 1,
      topOffset: 0,
    });
  }, [navigate, onChangeImage]);

  const handleSelectAction = useCallback(
    (actionKey: string) => {
      if (actionKey === 'library') {
        isRemoved.current = false;
        handleSelectImage();
      }
      if (actionKey === 'nft') {
        handleSelectNFT();
      }
      if (actionKey === 'remove') {
        isRemoved.current = true;
        onRemoveImage?.();
      }
    },
    [handleSelectImage, handleSelectNFT, onRemoveImage]
  );

  const ContextMenu = useCallback(
    ({ children, testID }: { children?: React.ReactNode; testID?: string }) => {
      return (
        <ContextMenuButton
          menuConfig={{
            menuItems: menuItems.map(item => items[item]),
            menuTitle: '',
          }}
          onPressMenuItem={({ nativeEvent: { actionKey } }) => handleSelectAction(actionKey)}
          testID={testID}
        >
          {children}
        </ContextMenuButton>
      );
    },
    [handleSelectAction, menuItems]
  );

  return {
    ContextMenu,
    handleSelectImage,
    handleSelectNFT,
    isUploading,
  };
}
