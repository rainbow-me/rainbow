import { TransactionStatus, TransactionType, TransactionTypeMap } from '@/entities';
import * as i18n from '@/languages';
import { time } from '@/utils';

export const TOAST_ICON_SIZE = 28;

export const SWAP_ICON_INTERSECT = TOAST_ICON_SIZE * 0.2;
export const SWAP_ICON_WIDTH = TOAST_ICON_SIZE * 2 - SWAP_ICON_INTERSECT;

export const TOAST_HEIGHT = 60;
export const TOAST_GAP_NEAR = 4; // gap for first two items
export const TOAST_GAP_FAR = 3.5; // gap for third item
export const TOAST_TOP_OFFSET = 10;
export const TOAST_INITIAL_OFFSET_ABOVE = -80;
export const TOAST_INITIAL_OFFSET_BELOW = 10;
export const TOAST_DONE_HIDE_TIMEOUT_MS = time.seconds(4);
export const TOAST_HIDE_TIMEOUT_MS = time.seconds(120); // max time to show a toast

// make dismissing easier (lower) or harder (higher)
export const TOAST_EXPANDED_DISMISS_SENSITIVITY = 0.5;
// upward dragging more sensitive
export const TOAST_EXPANDED_UPWARD_SENSITIVITY_MULTIPLIER = 2;

export const doneTransactionStatuses = {
  [TransactionStatus.approved]: i18n.t(i18n.l.toasts.statuses.approved),
  [TransactionStatus.bridged]: i18n.t(i18n.l.toasts.statuses.bridged),
  [TransactionStatus.cancelled]: i18n.t(i18n.l.toasts.statuses.cancelled),
  [TransactionStatus.confirmed]: i18n.t(i18n.l.toasts.statuses.confirmed),
  [TransactionStatus.deposited]: i18n.t(i18n.l.toasts.statuses.deposited),
  [TransactionStatus.dropped]: i18n.t(i18n.l.toasts.statuses.dropped),
  [TransactionStatus.failed]: i18n.t(i18n.l.toasts.statuses.failed),
  [TransactionStatus.launched]: i18n.t(i18n.l.toasts.statuses.launched),
  [TransactionStatus.minted]: i18n.t(i18n.l.toasts.statuses.minted),
  [TransactionStatus.purchased]: i18n.t(i18n.l.toasts.statuses.purchased),
  [TransactionStatus.received]: i18n.t(i18n.l.toasts.statuses.received),
  [TransactionStatus.sent]: i18n.t(i18n.l.toasts.statuses.sent),
  [TransactionStatus.sold]: i18n.t(i18n.l.toasts.statuses.sold),
  [TransactionStatus.swapped]: i18n.t(i18n.l.toasts.statuses.swapped),
  [TransactionStatus.withdrew]: i18n.t(i18n.l.toasts.statuses.withdrew),
} as const satisfies Partial<Record<TransactionStatus, string>>;

export const allTransactionStatuses: Record<TransactionStatus, string> = {
  [TransactionStatus.approving]: i18n.t(i18n.l.toasts.statuses.approving),
  [TransactionStatus.bridging]: i18n.t(i18n.l.toasts.statuses.bridging),
  [TransactionStatus.cancelling]: i18n.t(i18n.l.toasts.statuses.cancelling),
  [TransactionStatus.contract_interaction]: i18n.t(i18n.l.toasts.statuses.contract_interaction),
  [TransactionStatus.depositing]: i18n.t(i18n.l.toasts.statuses.depositing),
  [TransactionStatus.launching]: i18n.t(i18n.l.toasts.statuses.launching),
  [TransactionStatus.minting]: i18n.t(i18n.l.toasts.statuses.minting),
  [TransactionStatus.pending]: i18n.t(i18n.l.toasts.statuses.pending),
  [TransactionStatus.purchasing]: i18n.t(i18n.l.toasts.statuses.purchasing),
  [TransactionStatus.receiving]: i18n.t(i18n.l.toasts.statuses.receiving),
  [TransactionStatus.self]: i18n.t(i18n.l.toasts.statuses.self),
  [TransactionStatus.selling]: i18n.t(i18n.l.toasts.statuses.selling),
  [TransactionStatus.sending]: i18n.t(i18n.l.toasts.statuses.sending),
  [TransactionStatus.speeding_up]: i18n.t(i18n.l.toasts.statuses.speeding_up),
  [TransactionStatus.swapping]: i18n.t(i18n.l.toasts.statuses.swapping),
  [TransactionStatus.unknown]: i18n.t(i18n.l.toasts.statuses.unknown),
  [TransactionStatus.withdrawing]: i18n.t(i18n.l.toasts.statuses.withdrawing),
  ...doneTransactionStatuses,
};

export const transactionTypeToPendingStatus: Record<TransactionType, string> = {
  airdrop: i18n.t(i18n.l.toasts.statuses.airdropping),
  approve: allTransactionStatuses.approving,
  bid: i18n.t(i18n.l.toasts.statuses.bidding),
  borrow: i18n.t(i18n.l.toasts.statuses.borrowing),
  bridge: allTransactionStatuses.bridging,
  burn: i18n.t(i18n.l.toasts.statuses.burning),
  cancel: allTransactionStatuses.cancelling,
  claim: i18n.t(i18n.l.toasts.statuses.claiming),
  contract_interaction: allTransactionStatuses.pending,
  deployment: i18n.t(i18n.l.toasts.statuses.deploying),
  deposit: allTransactionStatuses.depositing,
  launch: allTransactionStatuses.launching,
  mint: allTransactionStatuses.minting,
  purchase: allTransactionStatuses.purchasing,
  receive: allTransactionStatuses.receiving,
  repay: i18n.t(i18n.l.toasts.statuses.repaying),
  revoke: i18n.t(i18n.l.toasts.statuses.revoking),
  sale: allTransactionStatuses.selling,
  send: allTransactionStatuses.sending,
  speed_up: allTransactionStatuses[TransactionStatus.speeding_up],
  stake: i18n.t(i18n.l.toasts.statuses.staking),
  swap: allTransactionStatuses.swapping,
  unstake: i18n.t(i18n.l.toasts.statuses.unstaking),
  unwrap: i18n.t(i18n.l.toasts.statuses.unwrapping),
  withdraw: allTransactionStatuses.withdrawing,
  wrap: i18n.t(i18n.l.toasts.statuses.wrapping),
};
