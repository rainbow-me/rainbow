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
    Alert.alert(
      'Save remote Image',
      'Failed to save Image: ' + err.message,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  }
};

const saveToCameraRoll = async url => {
  // if device is android you have to ensure you have permission
  if (Platform.OS === 'android') {
    const granted = await getPermissionAndroid();
    if (!granted) {
      return;
    }
  }
  RNFetchBlob.config({
    fileCache: true,
  })
    .fetch('GET', url)
    .then(res => {
      CameraRoll.save(res.data).catch(err => {
        Alert.alert(
          'Save remote Image',
          'Failed to save Image: ' + err.message,
          [{ onPress: () => {}, text: 'OK' }],
          { cancelable: false }
        );
      });
    })
    .catch(error => {
      Alert.alert(
        'Save remote Image',
        'Failed to save Image: ' + error.message,
        [{ onPress: () => {}, text: 'OK' }],
        { cancelable: false }
      );
    });
};

export default saveToCameraRoll;
