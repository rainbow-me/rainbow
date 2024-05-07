import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import lang from 'i18n-js';
import { PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';
import { WrappedAlert as Alert } from '@/helpers/alert';

const getPermissionAndroid = async () => {
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
  } catch (err) {
    alertError(err);
  }
};

function alertError(err) {
  Alert.alert(
    lang.t('expanded_state.unique.save.failed_to_save_image'),
    err.message ? `${err.message}` : '',
    [{ text: lang.t('button.ok') }],
    { cancelable: false }
  );
}

function getFilename(url) {
  url = url
    .split('/')
    .pop()
    .replace(/#(.*?)$/, '')
    .replace(/\?(.*?)$/, '');
  url = url.split('.');
  return { ext: url[1], filename: url[0] || '' };
}

async function downloadImageAndroid(url) {
  const granted = await getPermissionAndroid();
  if (!granted) {
    alertError({
      message: lang.t('expanded_state.unique.save.access_to_photo_library_was_denied'),
    });
    return;
  }
  let { filename, ext } = getFilename(url);
  // first fetch to get metadata
  const result = await RNFetchBlob.config({
    fileCache: true,
  })
    .fetch('GET', url)
    .catch(alertError);
  const mime = result?.respInfo?.headers['content-type'];
  if (!ext) {
    ext = mime?.split('/')?.[1];
  }
  if (!ext) {
    alertError();
    return;
  }
  const { config, fs } = RNFetchBlob;
  const { PictureDir } = fs.dirs;
  const path = PictureDir + '/nft_' + filename + Date.now().toString() + '.' + ext;
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
  // second fetch, probably cached, to save image correctly
  config(options).fetch('GET', url).catch(alertError);
}

function downloadImageIOS(url) {
  CameraRoll.save(url).catch(alertError);
}

const saveToCameraRoll = async url => {
  // if device is android you have to ensure you have permission
  if (Platform.OS === 'android') {
    downloadImageAndroid(url);
  } else {
    downloadImageIOS(url);
  }
};

export default saveToCameraRoll;
