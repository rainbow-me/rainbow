import CameraRoll from '@react-native-community/cameraroll';
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

const getPermissionAndroid = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
        message: 'Your permission is required to save images to your device',
        title: 'Image Download Permission',
      }
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }
  } catch (err) {
    alertError(err);
  }
};

function alertError(err) {
  Alert.alert(
    'Failed to save Image',
    err.message ? `${err.message}` : '',
    [{ text: 'OK' }],
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
    alertError('no permission');
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
  const path =
    PictureDir + '/nft_' + filename + Date.now().toString() + '.' + ext;
  const options = {
    addAndroidDownloads: {
      description: 'NFT image',
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
