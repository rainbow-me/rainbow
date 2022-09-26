import notifee from '@notifee/react-native';
import { ANDROID_DEFAULT_CHANNEL_ID } from './constants';

export async function setupAndroidChannels() {
  await notifee.createChannel({
    id: ANDROID_DEFAULT_CHANNEL_ID,
    name: 'Default',
  });
}
