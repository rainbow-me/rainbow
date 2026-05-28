import { type ChainId } from '@/state/backendNetworks/types';

export enum RequestSource {
  WALLETCONNECT = 'walletconnect',
  BROWSER = 'browser',
  MOBILE_WALLET_PROTOCOL = 'mobile-wallet-protocol',
}

/**
 * Display details loaded for a request.
 */
export interface RequestDisplayDetails {
  /**
   * Data loaded for the request, depending on the type of request.
   */
  request: any;

  /**
   * The timestamp for the request.
   */
  timestampInMs: number;
}

export interface RequestData {
  dappName: string;
  imageUrl: string | undefined;
  address: string;
  chainId: ChainId;
  dappUrl: string;
  payload: {
    method: string;
    params?: any[];
  };
  displayDetails: RequestDisplayDetails | null | Record<string, never>;
}
