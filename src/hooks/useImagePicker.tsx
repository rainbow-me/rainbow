import * as i18n from '@/languages';
import { useCallback } from 'react';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator } from 'expo-image-manipulator';
import { Alert } from '../components/alerts';

export type ImagePickerOptions = ImagePicker.ImagePickerOptions & {
  width?: number;
  height?: number;
};

export default function useImagePicker() {
  const openPicker = useCallback(
    async ({ width, height, ...options }: ImagePickerOptions): Promise<ImagePicker.ImagePickerAsset | null> => {
      let result: ImagePicker.ImagePickerResult | null = null;
      try {
        result = await ImagePicker.launchImageLibraryAsync(options);
      } catch (e: any) {
        if (e?.message === 'User did not grant library permission.') {
          Alert({
            buttons: [
              { style: 'cancel', text: i18n.t(i18n.l.image_picker.cancel) },
              {
                onPress: Linking.openSettings,
                text: i18n.t(i18n.l.image_picker.confirm),
              },
            ],
            message: i18n.t(i18n.l.image_picker.message),
            title: i18n.t(i18n.l.image_picker.title),
          });
        }
      }

      let image = result?.assets?.at(0);

      if (image && width != null && height != null) {
        const { width: originalWidth, height: originalHeight } = image;

        const scale = Math.max(width / originalWidth, height / originalHeight);
        const resizedWidth = Math.ceil(originalWidth * scale);
        const resizedHeight = Math.ceil(originalHeight * scale);

        const originX = Math.floor((resizedWidth - width) / 2);
        const originY = Math.floor((resizedHeight - height) / 2);
        const transformedImage = await ImageManipulator.manipulate(image.uri)
          .resize({ width: resizedWidth, height: resizedHeight })
          .crop({ originX, originY, width, height })
          .renderAsync();
        image = await transformedImage.saveAsync();
      }

      return image ?? null;
    },
    []
  );

  return {
    openPicker,
  };
}
