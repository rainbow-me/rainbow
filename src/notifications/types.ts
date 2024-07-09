import { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

export const NotificationTypes = {
  transaction: 'transaction',
  walletConnect: 'wc',
  marketing: 'marketing',
} as const;

export type NotificationTypesType = (typeof NotificationTypes)[keyof typeof NotificationTypes];

// FCM sends a different kind than the typings cover
export interface FixedRemoteMessage extends FirebaseMessagingTypes.RemoteMessage {
  data: { [key: string]: string } & { fcm_options: { image: string } };
}

export interface MinimalNotification {
  data?: { [key: string]: string | object };
  title?: string;
  body?: string;
}

export interface TransactionNotificationData {
  type: 'transaction';
  address: string;
  chain: string;
  hash: string;
  transaction_type: NotificationTransactionTypesType;
}

export const NotificationTransactionTypes = {
  approve: 'approve',
  burn: 'burn',
  cancel: 'cancel',
  contract_interaction: 'contract_interaction',
  deposit: 'deposit',
  mint: 'mint',
  purchase: 'purchase',
  receive: 'receive',
  revoke: 'revoke',
  sale: 'sale',
  send: 'send',
  swap: 'swap',
  withdraw: 'withdraw',
} as const;

export type NotificationTransactionTypesType = (typeof NotificationTransactionTypes)[keyof typeof NotificationTransactionTypes];

export interface MarketingNotificationData {
  type: 'marketing';
  route?: string;
  routeProps?: string;
}
