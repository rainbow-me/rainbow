import { Alert } from 'react-native';
import codePush from 'react-native-code-push';
import {
  // @ts-ignore
  APP_CENTER_READ_ONLY_TOKEN_ANDROID,
  // @ts-ignore
  APP_CENTER_READ_ONLY_TOKEN_IOS,
  // @ts-ignore
  CODE_PUSH_DEPLOYMENT_KEY_ANDROID,
  // @ts-ignore
  CODE_PUSH_DEPLOYMENT_KEY_IOS,
} from 'react-native-dotenv';
import { rainbowFetch } from '../rainbow-fetch';
import { Navigation } from '@rainbow-me/navigation';
import Routes from '@rainbow-me/routes';

const APP_CENTER_READ_ONLY_TOKEN = ios
  ? APP_CENTER_READ_ONLY_TOKEN_IOS
  : APP_CENTER_READ_ONLY_TOKEN_ANDROID;

async function checkIfRainbowRelease(deploymentKey: string): Promise<boolean> {
  try {
    const response = await rainbowFetch(
      `https://api.appcenter.ms/v0.1/apps/rainbow-studio/rainbow-${
        ios ? 'ios' : 'android'
      }-codepush/deployments`,
      {
        headers: {
          'X-API-Token': APP_CENTER_READ_ONLY_TOKEN,
        },
        method: 'get',
      }
    );
    if (
      response?.data?.find(({ key }: { key: string }) => key === deploymentKey)
    ) {
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export const CODE_PUSH_DEPLOYMENT_KEY = ios
  ? CODE_PUSH_DEPLOYMENT_KEY_IOS
  : CODE_PUSH_DEPLOYMENT_KEY_ANDROID;

export const isCustomBuild = { value: false };

export async function setDeploymentKey(key: string) {
  if (!key) {
    return;
  }
  const metadata = await codePush.getUpdateMetadata();

  if (metadata?.deploymentKey === key) {
    return;
  }

  const isRainbowRelease = await checkIfRainbowRelease(key);

  if (!isRainbowRelease) {
    Alert.alert(
      'Fedora',
      'Cannot verify the bundle! This might be a scam. Installation blocked.'
    );
    return;
  }

  Alert.alert(
    'Fedora',
    `This will override your bundle. Be careful. Are you a Rainbow employee?`,
    [
      {
        onPress: async () => {
          Alert.alert('wait');

          const result = await codePush.sync({
            deploymentKey: key,
            installMode: codePush.InstallMode.IMMEDIATE,
          });

          // @ts-ignore
          const resultString = Object.entries(codePush.syncStatus).find(
            e => e[1] === result
          )?.[0];

          Alert.alert(resultString || 'ERROR');
        },
        text: 'Ok',
      },
      {
        onPress: () => {},
        style: 'cancel',
        text: 'Cancel',
      },
    ]
  );
}

export function setOriginalDeploymentKey() {
  Navigation.handleAction(Routes.WALLET_SCREEN, {});
  Alert.alert('wait');
  codePush.clearUpdates();
  setTimeout(codePush.restartApp, 1000);
}

const COPEPUSH_IOS_PREFFIX = 'update-ios-';
const COPEPUSH_ANDROID_PREFFIX = 'update-android-';

export function handleQRScanner(data: string): boolean {
  if (data.startsWith(COPEPUSH_IOS_PREFFIX)) {
    if (android) {
      Alert.alert('Tried to use Android bundle');
      return false;
    } else {
      setDeploymentKey(data.substring(COPEPUSH_IOS_PREFFIX.length));
      return true;
    }
  }

  if (data.startsWith(COPEPUSH_ANDROID_PREFFIX)) {
    if (ios) {
      Alert.alert('Tried to use iOS bundle');
      return false;
    } else {
      setDeploymentKey(data.substring(COPEPUSH_ANDROID_PREFFIX.length));
      return true;
    }
  }
  return false;
}
