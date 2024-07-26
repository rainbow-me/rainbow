import Routes from '@/navigation/routesNames';

export type Screen = keyof typeof Routes;

export enum SwapsOperations {
  FetchQuotes = 'FetchQuotes',
  ExecuteSwap = 'ExecuteSwap',
  // Add other swap operations as needed
}

export enum SendOperations {
  CalculateFee = 'CalculateFee',
  SendTransaction = 'SendTransaction',
  // Add other send operations as needed
}

export type ScreenOperations = Partial<{
  [Routes.SWAP]: SwapsOperations;
  [Routes.SEND_SHEET]: SendOperations;
  // Add other screens and their operations as needed
}>;

export type OperationForScreen<S extends Screen> = S extends keyof ScreenOperations
  ? ScreenOperations[S] extends { [key: string]: string }
    ? ScreenOperations[S][keyof ScreenOperations[S]]
    : string
  : string;

export interface PerformanceLog<S extends Screen> {
  screen: S;
  operation: OperationForScreen<S>;
  duration: number;
  timestamp: number;
}

export type AnyPerformanceLog = PerformanceLog<Screen>;
