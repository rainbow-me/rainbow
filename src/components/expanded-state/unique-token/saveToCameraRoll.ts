/* eslint-disable @typescript-eslint/no-explicit-any */
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import i18n from '@/languages';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { shouldCreateImgixClient } from '@/handlers/imgix';

async function getPermissionAndroid(): Promise<boolean | undefined> {
  try {
    if (Number(Platform.Version) >= 33) {
      return true;
    }

    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      buttonNegative: i18n.button.cancel(),
      buttonPositive: i18n.button.ok(),
      message: i18n.expanded_state.unique.save.your_permission_is_required(),
      title: i18n.expanded_state.unique.save.image_download_permission(),
    });

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
  } catch (e: any) {
    alertError(e);
  }

  return undefined;
}

function alertError(error?: { message?: string }): void {
  Alert.alert(
    i18n.expanded_state.unique.save.failed_to_save_image(),
    error?.message ? `${error.message}` : '',
    [{ text: i18n.button.ok() }],
    { cancelable: false }
  );
}

async function downloadImageAndroid(url: string): Promise<void> {
  const granted = await getPermissionAndroid();
  if (!granted) {
    alertError({
      message: i18n.expanded_state.unique.save.access_to_photo_library_was_denied(),
    });
    return;
  }

  const { config } = RNFetchBlob;
  const options = {
    fileCache: true,
    appendExt: 'png',
  };

  try {
    const finalRes = await config(options).fetch('GET', url);
    await CameraRoll.saveAsset(finalRes.path(), { type: 'photo' });
  } catch (error: any) {
    alertError(error);
  }
}

async function downloadImageIOS(url: string): Promise<void> {
  try {
    const res = await RNFetchBlob.config({ fileCache: true, appendExt: 'png' }).fetch('GET', url);
    await CameraRoll.saveAsset(res.path(), { type: 'photo' });
  } catch (e: any) {
    alertError(e);
  }
}

const saveToCameraRoll = async (url: string): Promise<void> => {
  const staticImgixClient = shouldCreateImgixClient();
  if (!staticImgixClient) {
    alertError();
    return;
  }
  const url2Download = staticImgixClient?.buildURL(url, { fm: 'png' });

  if (Platform.OS === 'android') {
    await downloadImageAndroid(url2Download);
  } else {
    await downloadImageIOS(url2Download);
  }
};

export default saveToCameraRoll;
