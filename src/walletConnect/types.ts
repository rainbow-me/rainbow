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

export type AuthRequestAuthenticateSignature = (props: {
  address: string;
}) => Promise<AuthRequestAuthenticateResult>;
