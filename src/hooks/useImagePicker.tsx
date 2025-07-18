import lang from 'i18n-js';
import { useCallback } from 'react';
import { Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from '../components/alerts';

export default function useImagePicker() {
  const openPicker = useCallback(async (options: ImagePicker.ImagePickerOptions) => {
    let image: ImagePicker.ImagePickerResult | null = null;
    try {
      image = await ImagePicker.launchImageLibraryAsync(options);
    } catch (e: any) {
      if (e?.message === 'User did not grant library permission.') {
        Alert({
          buttons: [
            { style: 'cancel', text: lang.t('image_picker.cancel') },
            {
              onPress: Linking.openSettings,
              text: lang.t('image_picker.confirm'),
            },
          ],
          message: lang.t('image_picker.message'),
          title: lang.t('image_picker.title'),
        });
      }
    }
    return image;
  }, []);

  return {
    openPicker,
  };
}
