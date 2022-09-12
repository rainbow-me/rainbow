import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export const NotificationTypes = {
  transaction: 'transaction',
  walletConnect: 'wc',
} as const;

export type NotificationTypesType = typeof NotificationTypes[keyof typeof NotificationTypes];

// FCM sends a different kind than the typings cover
export interface FixedRemoteMessage
  extends FirebaseMessagingTypes.RemoteMessage {
  data: { [key: string]: string } & { fcm_options: { image: string } };
}

export interface MinimalNotification {
  data?: { [key: string]: string };
  title?: string;
  body?: string;
}

export interface TransactionNotificationData {
  type: 'transaction';
  address: string;
  chain: string;
  hash: string;
}
