/* eslint-disable @typescript-eslint/no-explicit-any */
import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import lang from 'i18n-js';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { WrappedAlert as Alert } from '@/helpers/alert';
import { shouldCreateImgixClient } from '@/handlers/imgix';

async function getPermissionAndroid(): Promise<boolean | undefined> {
  try {
    const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE, {
      buttonNegative: lang.t('button.cancel'),
      buttonPositive: lang.t('button.ok'),
      message: lang.t('expanded_state.unique.save.your_permission_is_required'),
      title: lang.t('expanded_state.unique.save.image_download_permission'),
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
    lang.t('expanded_state.unique.save.failed_to_save_image'),
    error?.message ? `${error.message}` : '',
    [{ text: lang.t('button.ok') }],
    { cancelable: false }
  );
}

function getFilename(url: string): { ext?: string; filename: string } {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const processedUrl = url
    .split('/')
    .pop()!
    .replace(/#(.*?)$/, '')
    .replace(/\?(.*?)$/, '');

  const parts = processedUrl.split('.');
  const ext = parts[1];
  const filename = parts[0] || '';

  return { ext, filename };
}

async function downloadImageAndroid(url: string): Promise<void> {
  const granted = await getPermissionAndroid();
  if (!granted) {
    alertError({
      message: lang.t('expanded_state.unique.save.access_to_photo_library_was_denied'),
    });
    return;
  }

  const { filename, ext } = getFilename(url);

  // first fetch to get metadata
  let result;
  try {
    result = await RNFetchBlob.config({ fileCache: true }).fetch('GET', url);
  } catch (e: any) {
    alertError(e);
    return;
  }

  const mime = result?.respInfo?.headers['content-type'];

  if (!ext) {
    alertError();
    return;
  }

  const { config, fs } = RNFetchBlob;
  const { PictureDir } = fs.dirs;
  const path = `${PictureDir}/nft_${filename}${Date.now().toString()}.${ext}`;
  const options = {
    addAndroidDownloads: {
      description: lang.t('expanded_state.unique.save.nft_image'),
      mime,
      notification: true,
      path,
      useDownloadManager: true,
    },
    fileCache: true,
  };

  try {
    await config(options).fetch('GET', url);
  } catch (error: any) {
    alertError(error);
  }
}

async function downloadImageIOS(url: string): Promise<void> {
  try {
    const res = await RNFetchBlob.config({ fileCache: true, appendExt: 'png' }).fetch('GET', url);
    await CameraRoll.save(res.path(), { type: 'photo' });
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
  const url2Download = staticImgixClient?.buildURL(url);

  if (Platform.OS === 'android') {
    await downloadImageAndroid(url2Download);
  } else {
    await downloadImageIOS(url2Download);
  }
};

export default saveToCameraRoll;
