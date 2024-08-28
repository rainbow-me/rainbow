export enum Screens {
  DAPP_BROWSER = 'DappBrowser',
  SWAPS = 'Swaps',
  SEND = 'Send',
  SEND_ENS = 'SendENS',
  WALLETCONNECT = 'WalletConnect',
  MOBILE_WALLET_PROTOCOL = 'MobileWalletProtocol',
}

type RouteValues = (typeof Screens)[keyof typeof Screens];

// Now, define Screen as the type of these values
export type Screen = RouteValues;

export enum TimeToSignOperation {
  CallToAction = 'CallToAction',
  KeychainRead = 'KeychainRead',
  Authentication = 'Authentication',
  CreateRap = 'CreateRap',
  SignTransaction = 'SignTransaction',
  CreateSignableTransaction = 'CreateSignableTransaction',
  BroadcastTransaction = 'BroadcastTransaction',
  SheetDismissal = 'SheetDismissal',
}

export type ScreenOperations = Partial<{
  [Screens.SWAPS]: TimeToSignOperation;
  [Screens.SEND]: TimeToSignOperation;
  [Screens.SEND_ENS]: TimeToSignOperation;
  [Screens.DAPP_BROWSER]: TimeToSignOperation;
  [Screens.WALLETCONNECT]: TimeToSignOperation;
}>;

export type OperationForScreen<S extends Screen> = S extends keyof ScreenOperations
  ? ScreenOperations[S] extends { [key: string]: string }
    ? ScreenOperations[S][keyof ScreenOperations[S]]
    : string
  : string;

export interface PerformanceLog<S extends Screen> {
  screen: S;
  operation: OperationForScreen<S>;
  startTime: number;
  endTime: number;
  timeToCompletion: number;
  completedAt: number;
  metadata?: Record<string, string | number | boolean>;
}

export type AnyPerformanceLog = PerformanceLog<Screen>;
