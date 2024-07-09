/**
 * Enum with all performance metrics events strings
 */

export const PerformanceMetrics = {
  completeStartupTime: 'Performance Complete Startup Time',
  loadJSBundle: 'Performance Time To Load JS Bundle',
  loadRootAppComponent: 'Performance Time To Load Root App Component',
  timeToInteractive: 'Performance Time To Interactive',
  useInitializeWallet: 'Performance Wallet Initialize Time',
  initializeWalletconnect: 'Performance WalletConnect Initialize Time',

  quoteFetching: 'Performance Quote Fetching Time',
} as const;

export type PerformanceMetricsType = (typeof PerformanceMetrics)[keyof typeof PerformanceMetrics];
