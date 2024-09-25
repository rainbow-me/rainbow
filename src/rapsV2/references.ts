import { TransactionClaimableTxPayload } from '@/screens/claimables/ClaimingTransactionClaimable';
import { Signer } from '@ethersproject/abstract-signer';

export interface ClaimTransactionClaimableActionParameters {
  claimTx: TransactionClaimableTxPayload;
}

export interface RapActionTransaction {
  hash: string | null;
}

export type RapActionParameterMap = {
  claimTransactionClaimableAction: ClaimTransactionClaimableActionParameters;
};

export type RapParameters = {
  type: 'claimTransactionClaimableRap';
  claimTransactionClaimableActionParameters: ClaimTransactionClaimableActionParameters;
};

export interface RapAction<T extends RapActionTypes> {
  parameters: RapActionParameterMap[T];
  transaction: RapActionTransaction;
  type: T;
}

export interface Rap {
  actions: RapAction<'claimTransactionClaimableAction'>[];
}

export enum rapActions {
  claimTransactionClaimableAction = 'claimTransactionClaimableAction',
}

export type RapActionTypes = keyof typeof rapActions;

export enum rapTypes {
  claimTransactionClaimableRap = 'claimTransactionClaimableRap',
}

export type RapTypes = keyof typeof rapTypes;

export interface RapActionResponse {
  nonce: number | null | undefined;
  errorMessage: string | null;
  hash: string | null | undefined;
}

export interface ActionProps<T extends RapActionTypes> {
  nonceToUse: number | undefined;
  parameters: RapActionParameterMap[T];
  wallet: Signer;
}

export interface RapResponse {
  errorMessage: string | null;
}
