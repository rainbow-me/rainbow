import lang from 'i18n-js';
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
import { WrappedAlert as Alert } from '@/helpers/alert';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';

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
    Alert.alert(lang.t('fedora.fedora'), lang.t('fedora.cannot_verify_bundle'));
    return;
  }

  Alert.alert(
    lang.t('fedora.fedora'),
    lang.t('fedora.this_will_override_bundle'),
    [
      {
        onPress: async () => {
          Alert.alert(lang.t('fedora.wait'));

          const result = await codePush.sync({
            deploymentKey: key,
            installMode: codePush.InstallMode.IMMEDIATE,
          });

          // @ts-ignore
          const resultString = Object.entries(codePush.syncStatus).find(
            e => e[1] === result
          )?.[0];

          Alert.alert(resultString || lang.t('fedora.error'));
        },
        text: lang.t('button.ok'),
      },
      {
        onPress: () => {},
        style: 'cancel',
        text: lang.t('button.cancel'),
      },
    ]
  );
}

export function setOriginalDeploymentKey() {
  Navigation.handleAction(Routes.WALLET_SCREEN, {});
  Alert.alert(lang.t('fedora.wait'));
  codePush.clearUpdates();
  setTimeout(codePush.restartApp, 1000);
}

const COPEPUSH_IOS_PREFFIX = 'update-ios-';
const COPEPUSH_ANDROID_PREFFIX = 'update-android-';

export function handleQRScanner(data: string): boolean {
  if (data.startsWith(COPEPUSH_IOS_PREFFIX)) {
    if (android) {
      Alert.alert(lang.t('deeplinks.tried_to_use_android'));
      return false;
    } else {
      setDeploymentKey(data.substring(COPEPUSH_IOS_PREFFIX.length));
      return true;
    }
  }

  if (data.startsWith(COPEPUSH_ANDROID_PREFFIX)) {
    if (ios) {
      Alert.alert(lang.t('deeplinks.tried_to_use_ios'));
      return false;
    } else {
      setDeploymentKey(data.substring(COPEPUSH_ANDROID_PREFFIX.length));
      return true;
    }
  }
  return false;
}
