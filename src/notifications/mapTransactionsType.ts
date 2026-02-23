import { type NotificationTransactionTypesType } from '@/notifications/types';
import { type TransactionType } from '@/entities/transactions';

/**
 * Mapping of notification backend transaction types sent in notification
 * payload, to internal `TransactionType` that we use in the app already.
 */
export function mapNotificationTransactionType(notificationTransactionType: NotificationTransactionTypesType): TransactionType {
  return notificationTransactionType;
}
