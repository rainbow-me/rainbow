import { NotificationTransactionTypes, NotificationTransactionTypesType } from '@/notifications/types';
import { TransactionType } from '@/entities';

/**
 * Mapping of notification backend transaction types sent in notification
 * payload, to internal `TransactionType` that we use in the app already.
 */
export function mapNotificationTransactionType(notificationTransactionType: NotificationTransactionTypesType): TransactionType {
  switch (notificationTransactionType) {
    case NotificationTransactionTypes.approve:
      return TransactionType.authorize;
    case NotificationTransactionTypes.cancel:
      return TransactionType.cancel;
    case NotificationTransactionTypes.deposit:
      return TransactionType.deposit;
    case NotificationTransactionTypes.purchase:
      return TransactionType.purchase;
    case NotificationTransactionTypes.receive:
      return TransactionType.receive;
    case NotificationTransactionTypes.send:
    case NotificationTransactionTypes.burn:
      return TransactionType.send;
    case NotificationTransactionTypes.swap:
      return TransactionType.trade;
    case NotificationTransactionTypes.withdraw:
      return TransactionType.withdraw;
    default:
      return TransactionType.contract_interaction;
  }
}
