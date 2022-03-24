import { useCallback } from 'react';
import { Linking } from 'react-native';
import ImagePicker, { Options } from 'react-native-image-crop-picker';
import { Alert } from '../components/alerts';

export default function useImagePicker() {
  const openPicker = useCallback(async (options: Options) => {
    let image = null;
    try {
      image = await ImagePicker.openPicker(options);
    } catch (e: any) {
      if (e?.message === 'User did not grant library permission.') {
        Alert({
          buttons: [
            { style: 'cancel', text: 'Cancel' },
            { onPress: Linking.openSettings, text: 'Enable library access' },
          ],
          message: 'This allows Rainbow to use your photos from your library',
          title: 'Allow to access your photos',
        });
      }
    }
    return image;
  }, []);

  return {
    openPicker,
  };
}
