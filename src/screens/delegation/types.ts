/**
 * Reasons for revoking delegation - determines the panel's appearance and messaging
 */
export enum RevokeReason {
  // User-triggered
  /** Toggle off Smart Wallet — revokes all chains */
  DISABLE_SMART_WALLET = 'disable_smart_wallet',
  /** Disable a single Rainbow-delegated chain */
  DISABLE_SINGLE_NETWORK = 'disable_single_network',
  /** Disable a third-party delegated chain */
  DISABLE_THIRD_PARTY = 'disable_third_party',
  // Backend-triggered (from shouldRevokeDelegation())
  /** Contract has a known exploit */
  ALERT_VULNERABILITY = 'alert_vulnerability',
  /** Contract has a known bug */
  ALERT_BUG = 'alert_bug',
  /** Unrecognized revoke reason from backend */
  ALERT_UNRECOGNIZED = 'alert_unrecognized',
  /** Catch-all for unspecified backend revoke signals */
  ALERT_UNSPECIFIED = 'alert_unspecified',
}

export type RevokeStatus =
  | 'notReady' // preparing the data necessary to revoke
  | 'ready' // ready to revoke state
  | 'revoking' // user has pressed the revoke button
  | 'pending' // revoke has been submitted but we don't have a tx hash
  | 'success' // revoke has been submitted and we have a tx hash
  | 'recoverableError' // revoke or auth has failed, can try again
  | 'unrecoverableError'; // revoke has failed, unrecoverable error

export type SheetContent = {
  title: string;
  subtitle: string;
  buttonLabel: string;
  accentColor: string;
};
