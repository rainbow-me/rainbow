import { ChainId } from '@/state/backendNetworks/types';
import { Address } from 'viem';
import { SignClientTypes, Verify } from '@walletconnect/types';
import { RequestSource } from '@/utils/requestNavigationHandlers';

/**
 * Display details loaded for a request.
 */
interface RequestDisplayDetails {
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
  payload: any;
  displayDetails: RequestDisplayDetails | null | Record<string, never>;
}

/**
 * A request stored in state.
 */
export interface WalletconnectRequestData extends RequestData {
  /**
   * The WalletConnect client ID for the request.
   */
  clientId: string;

  /**
   * The WalletConnect peer ID for the request.
   */
  peerId: string;

  /**
   * The request ID.
   */
  requestId: number;

  /**
   * The URL scheme to use for re-opening the dapp, or null.
   */
  dappScheme: string | null;

  /**
   * The display details loaded for the request.
   */
  displayDetails: RequestDisplayDetails | null | Record<string, never>;

  /**
   * Adds additional data to the request and serves as a notice that this
   * request originated from a WC v2 session
   */
  walletConnectV2RequestValues?: {
    sessionRequestEvent: SignClientTypes.EventArguments['session_request'];
    address: string;
    chainId: number;
    onComplete?: (type: string) => void;
  };
}

/**
 * Represents a WalletConnect result passed to a callback function.
 */
export type WalletconnectResultType = 'timedOut' | 'sign' | 'transaction' | 'sign-canceled' | 'transaction-canceled' | 'connect' | 'reject';

export type WalletconnectMeta = {
  /**
   * WC v2 introduced multi-chain support, while v1 only supported a single
   * chain at a time. To avoid confusion, we now send both as an array
   * `chainIds`. WC v1 will always be an array with length `1`, while v2 can
   * have more than one.
   */
  chainIds: number[];
  isWalletConnectV2?: boolean;
  proposedChainId?: number;
  proposedAddress?: string;
} & Pick<WalletconnectRequestData, 'dappName' | 'dappScheme' | 'dappUrl' | 'imageUrl' | 'peerId'>;

/**
 * Route parameters sent to a WalletConnect approval sheet.
 */
export interface WalletconnectApprovalSheetRouteParams {
  callback: (
    approved: boolean,
    chainId: ChainId,
    accountAddress: Address,
    peerId: WalletconnectRequestData['peerId'],
    dappScheme: WalletconnectRequestData['dappScheme'],
    dappName: WalletconnectRequestData['dappName'],
    dappUrl: WalletconnectRequestData['dappUrl']
  ) => Promise<unknown>;
  receivedTimestamp: number;
  currentChainId?: ChainId;
  meta?: WalletconnectMeta;
  timeout?: ReturnType<typeof setTimeout> | null;
  timedOut?: boolean;
  failureExplainSheetVariant?: string;
  verifiedData?: Verify.Context['verified'];
  source?: RequestSource;
}

export enum RPCMethod {
  Sign = 'eth_sign',
  PersonalSign = 'personal_sign',
  SignTypedData = 'eth_signTypedData',
  SignTypedDataV1 = 'eth_signTypedData_v1',
  SignTypedDataV3 = 'eth_signTypedData_v3',
  SignTypedDataV4 = 'eth_signTypedData_v4',
  SendTransaction = 'eth_sendTransaction',
  /**
   * @deprecated DO NOT USE, or ask Bruno
   */
  SignTransaction = 'eth_signTransaction',
  /**
   * @deprecated DO NOT USE, or ask Bruno
   */
  SendRawTransaction = 'eth_sendRawTransaction',
}

export type RPCPayload =
  | {
      method: RPCMethod.Sign | RPCMethod.PersonalSign;
      params: [string, string];
    }
  | {
      method: RPCMethod.SignTypedData | RPCMethod.SignTypedDataV1 | RPCMethod.SignTypedDataV3 | RPCMethod.SignTypedDataV4;
      params: [
        string, // address
        string, // stringify typed object
      ];
    }
  | {
      method: RPCMethod.SendTransaction;
      params: [
        {
          from: string;
          to: string;
          data: string;
          gasPrice: string;
          gasLimit: string;
          value: string;
        },
      ];
    }
  | {
      method: RPCMethod; // for TS safety, but others are not supported
      params: any[];
    };

export enum AuthRequestResponseErrorReason {
  Unknown = 'Unknown',
  ReadOnly = 'ReadOnly',
}

export type AuthRequestAuthenticateResult =
  | {
      success: true;
      reason: undefined;
    }
  | {
      success: false;
      reason: AuthRequestResponseErrorReason;
    };

export type AuthRequestAuthenticateSignature = (props: { address: string }) => Promise<AuthRequestAuthenticateResult>;
