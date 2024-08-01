import Routes from '@/navigation/routesNames';

type RouteValues = (typeof Routes)[keyof typeof Routes];

// Now, define Screen as the type of these values
export type Screen = RouteValues;

export enum TimeToSignOperation {
  CallToAction = 'CallToAction',
  KeychainRead = 'KeychainRead',
  Authentication = 'Authentication',
  CreateRap = 'CreateRap',
  SignTransaction = 'SignTransaction',
  BroadcastTransaction = 'BroadcastTransaction',
  SheetDismissal = 'SheetDismissal',
}

export type ScreenOperations = Partial<{
  [Routes.SWAP]: TimeToSignOperation;
  [Routes.SEND_SHEET]: TimeToSignOperation;
  [Routes.DAPP_BROWSER]: TimeToSignOperation;
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
