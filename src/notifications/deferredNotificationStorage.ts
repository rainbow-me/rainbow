import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import { MinimalNotification } from '@/notifications/types';

const deferredNotification: {
  current: FirebaseMessagingTypes.RemoteMessage | null;
} = {
  current: null,
};

function deferNotification(notification: MinimalNotification) {
  // @ts-ignore type mismatch
  deferredNotification.current = notification;
}

function clearDeferredNotification() {
  deferredNotification.current = null;
}

function getDeferredNotification(): MinimalNotification | null {
  return deferredNotification.current;
}

export const NotificationStorage = {
  deferNotification,
  clearDeferredNotification,
  getDeferredNotification,
};
