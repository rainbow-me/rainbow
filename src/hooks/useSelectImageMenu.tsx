import { useFocusEffect } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import lang from 'i18n-js';
import React, { useCallback, useMemo, useRef } from 'react';
import { Image, Options } from 'react-native-image-crop-picker';
import { ContextMenuButton } from 'react-native-ios-context-menu';
import { useImagePicker } from '.';
import { UniqueAsset } from '@/entities';
import { uploadImage, UploadImageReturnData } from '@/handlers/pinata';
import { useNavigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { showActionSheetWithOptions } from '@/utils';

type Action = 'library' | 'nft';

const items = {
  library: {
    actionKey: 'library',
    actionTitle: lang.t('profiles.create.upload_photo'),
    icon: {
      imageValue: {
        systemName: 'photo.on.rectangle.angled',
      },
      type: 'IMAGE_SYSTEM',
    },
  },
  nft: {
    actionKey: 'nft',
    actionTitle: lang.t('profiles.create.choose_nft'),
    icon: {
      imageValue: {
        systemName: 'square.grid.2x2',
      },
      testID: 'choose-nft',
      type: 'IMAGE_SYSTEM',
    },
  },
  remove: {
    actionKey: 'remove',
    actionTitle: lang.t('profiles.create.remove'),
    icon: {
      imageValue: {
        systemName: 'trash',
      },
      type: 'IMAGE_SYSTEM',
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
  testID = '',
}: {
  imagePickerOptions?: Options;
  menuItems?: Action[];
  onChangeImage?: ({ asset, image }: { asset?: UniqueAsset; image?: Image & { tmpPath?: string } }) => void;
  onRemoveImage?: () => void;
  onUploading?: ({ image }: { image: Image }) => void;
  onUploadSuccess?: ({ data, image }: { data: UploadImageReturnData; image: Image }) => void;
  onUploadError?: ({ error, image }: { error: unknown; image: Image }) => void;
  showRemove?: boolean;
  uploadToIPFS?: boolean;
  testID?: string;
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
  const isFocused = useRef<boolean>();
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
    () => [...initialMenuItems, showRemove ? 'remove' : undefined].filter(Boolean) as (Action | 'remove')[],
    [initialMenuItems, showRemove]
  );

  const handleSelectImage = useCallback(async () => {
    const image = await openPicker({
      ...imagePickerOptions,
      includeBase64: true,
      mediaType: 'photo',
    });
    if (!image) return;
    const stringIndex = image?.path.indexOf('/tmp');
    const tmpPath = ios ? `~${image?.path.slice(stringIndex)}` : image?.path;

    if (uploadToIPFS) {
      onUploading?.({ image });
      try {
        const splitPath = image.path.split('/');
        const filename = image.filename || splitPath[splitPath.length - 1] || '';
        const data = await upload({
          filename,
          mime: image.mime,
          path: image.path.replace('file://', ''),
        });
        if (!isFocused.current || isRemoved.current) return;
        onUploadSuccess?.({ data, image });
      } catch (err) {
        if (!isFocused.current || isRemoved.current) return;
        onUploadError?.({ error: err, image });
      }
    } else {
      onChangeImage?.({ image: { ...image, tmpPath } });
    }
  }, [imagePickerOptions, isRemoved, onChangeImage, onUploadError, onUploadSuccess, onUploading, openPicker, upload, uploadToIPFS]);

  const handleSelectNFT = useCallback(() => {
    navigate(Routes.SELECT_UNIQUE_TOKEN_SHEET, {
      onSelect: (asset: UniqueAsset) => onChangeImage?.({ asset }),
      springDamping: 1,
      topOffset: 0,
    });
  }, [navigate, onChangeImage]);

  const handlePressMenuItem = useCallback(
    // @ts-expect-error ContextMenu is an untyped JS component and can't type its onPress handler properly
    ({ nativeEvent: { actionKey } }) => {
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

  const handleAndroidPress = useCallback(() => {
    const actionSheetOptions = menuItems.map(item => items[item]?.actionTitle).filter(Boolean);

    showActionSheetWithOptions(
      {
        options: actionSheetOptions,
      },
      async (buttonIndex: number) => {
        if (buttonIndex === 0) {
          isRemoved.current = false;
          handleSelectImage();
        } else if (buttonIndex === 1) {
          handleSelectNFT();
        } else if (buttonIndex === 2) {
          isRemoved.current = true;
          onRemoveImage?.();
        }
      }
    );
  }, [handleSelectImage, handleSelectNFT, menuItems, onRemoveImage]);

  const ContextMenu = useCallback(
    ({ children }: { children?: React.ReactNode }) => (
      <ContextMenuButton
        enableContextMenu
        menuConfig={{
          menuItems: menuItems.map(item => items[item]) as any,
          menuTitle: '',
        }}
        {...(android ? { onPress: handleAndroidPress } : {})}
        isMenuPrimaryAction
        onPressMenuItem={handlePressMenuItem}
        testID={`use-select-image-${testID}`}
        useActionSheetFallback={false}
      >
        {children}
      </ContextMenuButton>
    ),
    [handleAndroidPress, handlePressMenuItem, menuItems, testID]
  );

  return { ContextMenu, handleSelectImage, handleSelectNFT, isUploading };
}
