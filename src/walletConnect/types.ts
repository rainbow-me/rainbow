import { ChainId } from '@/chains/types';
import { WalletconnectRequestData } from '../redux/requests';
import { Address } from 'viem';
import { Verify } from '@walletconnect/types';
import { RequestSource } from '@/utils/requestNavigationHandlers';

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
