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

interface Gas {
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}

type SwapData = {
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
  nonce?: number;
  flashbots?: boolean;
  address?: Address;
} & Gas;

export type CrosschainSwapActionParameters = SwapData & { quote: CrosschainQuote };

export interface UnlockActionParameters {
  fromAddress: Address;
  assetToUnlock: ParsedAsset;
  contractAddress: Address;
  chainId: number;
  gas: Gas;
}

export interface ClaimTransactionClaimableActionParameters {
  claimTx: TransactionClaimableTxPayload;
  asset: ParsedAddressAsset;
  gas?: Gas;
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
      crosschainSwapActionParameters: CrosschainSwapActionParameters;
      unlockActionParameters: UnlockActionParameters;
    }
  | {
      type: 'crosschainSwapRap';
      crosschainSwapActionParameters: CrosschainSwapActionParameters;
      unlockActionParameters: UnlockActionParameters;
    };

export interface RapAction<T extends RapActionTypes> {
  parameters: RapActionParameterMap[T];
  transaction: RapActionTransaction;
  type: T;
  shouldExpedite?: boolean;
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
  shouldExpedite?: boolean;
}

export interface RapResponse {
  errorMessage: string | null;
}
