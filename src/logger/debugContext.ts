/**
 * *Do not import this directly.* Instead, use the shortcut reference `logger.DebugContext`.
 *
 * Add debug contexts here. Although convention typically calls for enums ito
 * be capitalized, for parity with the `LOG_DEBUG` env var, please use all
 * lowercase.
 */
export const DebugContext = {
  // e.g. swaps: 'swaps'
  analytics: 'analytics',
  ledger: 'ledger',
  migrations: 'migrations',
  notifications: 'notifications',
  walletconnect: 'walletconnect',
  wallet: 'wallet',
  f2c: 'f2c',
  keychain: 'keychain',
  deeplinks: 'deeplinks',
} as const;
