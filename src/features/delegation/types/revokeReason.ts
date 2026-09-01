/**
 * Reasons for revoking delegation - determines the revoke panel's appearance and messaging
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
