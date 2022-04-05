import { Alert } from 'react-native';
import codePush from 'react-native-code-push';
import {
  // @ts-ignore
  CODE_PUSH_DEPLOYMENT_KEY_ANDROID,
  // @ts-ignore
  CODE_PUSH_DEPLOYMENT_KEY_IOS,
} from 'react-native-dotenv';

export const CODE_PUSH_DEPLOYMENT_KEY = ios
  ? CODE_PUSH_DEPLOYMENT_KEY_IOS
  : CODE_PUSH_DEPLOYMENT_KEY_ANDROID;

export let isCustomBuild = false;

export async function setDeploymentKey(key: string) {
  if (!key) {
    return;
  }
  const metadata = await codePush.getUpdateMetadata();

  if (metadata?.deploymentKey === key) {
    return;
  }

  Alert.alert(
    'Tophat',
    `This will override you bundle. Be careful. Are you Rainbow employee?`,
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

          resultString && Alert.alert(resultString);
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
  setDeploymentKey(CODE_PUSH_DEPLOYMENT_KEY);
}
