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
