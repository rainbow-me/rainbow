import { TransactionStatus, TransactionType } from '@/entities';
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

export const transactionTypeToPendingLabel: Record<TransactionType, string> = {
  airdrop: i18n.t(i18n.l.transactions.type['airdrop'].pending),
  approve: i18n.t(i18n.l.transactions.type['approve'].pending),
  bid: i18n.t(i18n.l.transactions.type['bid'].pending),
  borrow: i18n.t(i18n.l.transactions.type['borrow'].pending),
  bridge: i18n.t(i18n.l.transactions.type['bridge'].pending),
  burn: i18n.t(i18n.l.transactions.type['burn'].pending),
  cancel: i18n.t(i18n.l.transactions.type['cancel'].pending),
  claim: i18n.t(i18n.l.transactions.type['claim'].pending),
  contract_interaction: i18n.t(i18n.l.transactions.type['contract_interaction'].pending),
  deployment: i18n.t(i18n.l.transactions.type['deployment'].pending),
  deposit: i18n.t(i18n.l.transactions.type['deposit'].pending),
  launch: i18n.t(i18n.l.transactions.type['launch'].pending),
  mint: i18n.t(i18n.l.transactions.type['mint'].pending),
  purchase: i18n.t(i18n.l.transactions.type['purchase'].pending),
  receive: i18n.t(i18n.l.transactions.type['receive'].pending),
  repay: i18n.t(i18n.l.transactions.type['repay'].pending),
  revoke: i18n.t(i18n.l.transactions.type['revoke'].pending),
  sale: i18n.t(i18n.l.transactions.type['sale'].pending),
  send: i18n.t(i18n.l.transactions.type['send'].pending),
  speed_up: i18n.t(i18n.l.transactions.type['speed_up'].pending),
  stake: i18n.t(i18n.l.transactions.type['stake'].pending),
  swap: i18n.t(i18n.l.transactions.type['swap'].pending),
  unstake: i18n.t(i18n.l.transactions.type['unstake'].pending),
  unwrap: i18n.t(i18n.l.transactions.type['unwrap'].pending),
  withdraw: i18n.t(i18n.l.transactions.type['withdraw'].pending),
  wrap: i18n.t(i18n.l.transactions.type['wrap'].pending),
};

export const transactionTypeToConfirmedLabel: Record<TransactionType, string> = {
  airdrop: i18n.t(i18n.l.transactions.type['airdrop'].confirmed),
  approve: i18n.t(i18n.l.transactions.type['approve'].confirmed),
  bid: i18n.t(i18n.l.transactions.type['bid'].confirmed),
  borrow: i18n.t(i18n.l.transactions.type['borrow'].confirmed),
  bridge: i18n.t(i18n.l.transactions.type['bridge'].confirmed),
  burn: i18n.t(i18n.l.transactions.type['burn'].confirmed),
  cancel: i18n.t(i18n.l.transactions.type['cancel'].confirmed),
  claim: i18n.t(i18n.l.transactions.type['claim'].confirmed),
  contract_interaction: i18n.t(i18n.l.transactions.type['contract_interaction'].confirmed),
  deployment: i18n.t(i18n.l.transactions.type['deployment'].confirmed),
  deposit: i18n.t(i18n.l.transactions.type['deposit'].confirmed),
  launch: i18n.t(i18n.l.transactions.type['launch'].confirmed),
  mint: i18n.t(i18n.l.transactions.type['mint'].confirmed),
  purchase: i18n.t(i18n.l.transactions.type['purchase'].confirmed),
  receive: i18n.t(i18n.l.transactions.type['receive'].confirmed),
  repay: i18n.t(i18n.l.transactions.type['repay'].confirmed),
  revoke: i18n.t(i18n.l.transactions.type['revoke'].confirmed),
  sale: i18n.t(i18n.l.transactions.type['sale'].confirmed),
  send: i18n.t(i18n.l.transactions.type['send'].confirmed),
  speed_up: i18n.t(i18n.l.transactions.type['speed_up'].confirmed),
  stake: i18n.t(i18n.l.transactions.type['stake'].confirmed),
  swap: i18n.t(i18n.l.transactions.type['swap'].confirmed),
  unstake: i18n.t(i18n.l.transactions.type['unstake'].confirmed),
  unwrap: i18n.t(i18n.l.transactions.type['unwrap'].confirmed),
  withdraw: i18n.t(i18n.l.transactions.type['withdraw'].confirmed),
  wrap: i18n.t(i18n.l.transactions.type['wrap'].confirmed),
};

export const doneTransactionStatuses = {
  // not handled by existing transaction labels:
  [TransactionStatus.confirmed]: i18n.t(i18n.l.toasts.statuses.confirmed),
  [TransactionStatus.dropped]: i18n.t(i18n.l.toasts.statuses.dropped),
  [TransactionStatus.failed]: i18n.t(i18n.l.toasts.statuses.failed),

  [TransactionStatus.approved]: transactionTypeToConfirmedLabel.approve,
  [TransactionStatus.bridged]: transactionTypeToConfirmedLabel.bridge,
  [TransactionStatus.cancelled]: transactionTypeToConfirmedLabel.cancel,
  [TransactionStatus.deposited]: transactionTypeToConfirmedLabel.deposit,
  [TransactionStatus.launched]: transactionTypeToConfirmedLabel.launch,
  [TransactionStatus.minted]: transactionTypeToConfirmedLabel.mint,
  [TransactionStatus.purchased]: transactionTypeToConfirmedLabel.purchase,
  [TransactionStatus.received]: transactionTypeToConfirmedLabel.receive,
  [TransactionStatus.sent]: transactionTypeToConfirmedLabel.send,
  [TransactionStatus.sold]: transactionTypeToConfirmedLabel.sale,
  [TransactionStatus.swapped]: transactionTypeToConfirmedLabel.swap,
  [TransactionStatus.withdrew]: transactionTypeToConfirmedLabel.withdraw,
} as const satisfies Partial<Record<TransactionStatus, string>>;

export const allTransactionStatuses: Record<TransactionStatus, string> = {
  // not handled by existing transaction labels:
  [TransactionStatus.pending]: i18n.t(i18n.l.toasts.statuses.pending),
  [TransactionStatus.unknown]: i18n.t(i18n.l.toasts.statuses.pending),
  [TransactionStatus.self]: i18n.t(i18n.l.toasts.statuses.pending),

  [TransactionStatus.approving]: transactionTypeToPendingLabel.approve,
  [TransactionStatus.bridging]: transactionTypeToPendingLabel.bridge,
  [TransactionStatus.cancelling]: transactionTypeToPendingLabel.cancel,
  [TransactionStatus.contract_interaction]: transactionTypeToPendingLabel.contract_interaction,
  [TransactionStatus.depositing]: transactionTypeToPendingLabel.deposit,
  [TransactionStatus.launching]: transactionTypeToPendingLabel.launch,
  [TransactionStatus.minting]: transactionTypeToPendingLabel.mint,
  [TransactionStatus.purchasing]: transactionTypeToPendingLabel.purchase,
  [TransactionStatus.receiving]: transactionTypeToPendingLabel.receive,
  [TransactionStatus.selling]: transactionTypeToPendingLabel.sale,
  [TransactionStatus.sending]: transactionTypeToPendingLabel.send,
  [TransactionStatus.speeding_up]: transactionTypeToPendingLabel.speed_up,
  [TransactionStatus.swapping]: transactionTypeToPendingLabel.swap,
  [TransactionStatus.withdrawing]: transactionTypeToPendingLabel.withdraw,
  ...doneTransactionStatuses,
};
