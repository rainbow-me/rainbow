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
  | 'notReady' // no delegations to revoke
  | 'ready' // ready to revoke
  | 'revoking' // at least one chain is in-flight
  | 'success' // all chains succeeded
  | 'error' // at least one chain failed (retry-able)
  | 'insufficientGas'; // all remaining chains lack gas (non-retry-able)

export type ChainRevokeStatus =
  | 'pending' // not yet attempted
  | 'revoking' // tx in-flight
  | 'success' // tx confirmed
  | 'error' // tx failed, can retry
  | 'insufficientGas'; // skipped, native balance too low
