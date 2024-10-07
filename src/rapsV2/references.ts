import { ParsedAsset } from '@/__swaps__/types/assets';
import {
  GasFeeParamsBySpeed,
  LegacyGasFeeParamsBySpeed,
  LegacyTransactionGasParamAmounts,
  ParsedAddressAsset,
  TransactionGasParamAmounts,
} from '@/entities';
import { SwapMetadata } from '@/raps/references';
import { TransactionClaimableTxPayload } from '@/screens/claimables/ClaimingTransactionClaimable';
import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote } from '@rainbow-me/swaps';
import { Address } from 'viem';

interface SwapData {
  amount?: string | null;
  sellAmount: string;
  buyAmount?: string;
  permit?: boolean;
  chainId: number;
  toChainId?: number;
  requiresApprove?: boolean;
  meta?: SwapMetadata;
  assetToSell: ParsedAsset;
  assetToBuy: ParsedAsset;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
  nonce?: number;
  flashbots?: boolean;
  address?: Address;
}

export interface CrosschainSwapActionParameters {
  swapData: SwapData & { quote: CrosschainQuote };
}

export interface UnlockActionParameters {
  amount: string;
  assetToUnlock: ParsedAsset;
  contractAddress: Address;
  chainId: number;
}

export interface ClaimTransactionClaimableActionParameters {
  claimTx: TransactionClaimableTxPayload;
  asset: ParsedAddressAsset;
}

export interface RapActionTransaction {
  hash: string | null;
}

export type RapActionParameterMap = {
  claimTransactionClaimableAction: ClaimTransactionClaimableActionParameters;
  crosschainSwapAction: CrosschainSwapActionParameters;
  unlockAction: UnlockActionParameters;
};

export type RapParameters =
  | {
      type: 'claimTransactionClaimableRap';
      claimTransactionClaimableActionParameters: ClaimTransactionClaimableActionParameters;
    }
  | {
      type: 'crosschainSwapRap';
      crosschainSwapActionParameters: CrosschainSwapActionParameters;
      unlockActionParameters: UnlockActionParameters;
      gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
      gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
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
  crosschainSwapAction = 'crosschainSwapAction',
  unlockAction = 'unlockAction',
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
