import { Signer } from '@ethersproject/abstract-signer';
import { CrosschainQuote, Quote } from '@rainbow-me/swaps';
import { Address } from 'viem';

import { ParsedAsset } from '@/__swaps__/types/assets';
import { GasFeeParamsBySpeed, LegacyGasFeeParamsBySpeed, LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';
import { TransactionClaimableTxPayload } from '@/screens/claimables/transaction/types';
import { SwapsGasFeeParamsBySpeed } from '@/__swaps__/screens/Swap/hooks/useSelectedGas';

export enum SwapModalField {
  input = 'inputAmount',
  native = 'nativeAmount',
  output = 'outputAmount',
}

export enum Source {
  AggregatorRainbow = 'rainbow',
  Aggregator0x = '0x',
  Aggregator1inch = '1inch',
  Socket = 'socket',
}

export interface UnlockActionParameters {
  amount: string;
  assetToUnlock: ParsedAsset;
  contractAddress: Address;
  chainId: number;
}

export type SwapMetadata = {
  slippage: number;
  route: Source;
  inputAsset: ParsedAsset;
  outputAsset: ParsedAsset;
  independentField: SwapModalField;
  independentValue: string;
};

export type QuoteTypeMap = {
  swap: Quote;
  crosschainSwap: CrosschainQuote;
  claimBridge: undefined;
  claimClaimable: Quote | CrosschainQuote;
};

type AdditionalParamsMap = {
  swap: undefined;
  crosschainSwap: undefined;
  claimBridge: undefined;
  claimClaimable: { claimTxns: TransactionClaimableTxPayload[] };
};

export interface RapSwapActionParameters<T extends 'swap' | 'crosschainSwap' | 'claimBridge' | 'claimClaimable'> {
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
  gasFeeParamsBySpeed: SwapsGasFeeParamsBySpeed | (GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed);
  nonce?: number;
  quote: QuoteTypeMap[T];
  address?: Address;
  additionalParams?: AdditionalParamsMap[T];
}

export interface RapUnlockActionParameters {
  fromAddress: Address;
  assetToUnlock: ParsedAsset;
  contractAddress: Address;
  chainId: number;
}

export interface RapClaimActionParameters {
  address?: Address;
  assetToSell: ParsedAsset;
  sellAmount: string;
  assetToBuy: ParsedAsset;
  meta?: SwapMetadata;
  chainId: ChainId;
  toChainId?: ChainId;
  quote: undefined;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
}

export type RapClaimClaimableActionParameters = { claimTx: TransactionClaimableTxPayload; asset: ParsedAsset };

export type RapActionParameters =
  | RapSwapActionParameters<'swap'>
  | RapSwapActionParameters<'crosschainSwap'>
  | RapClaimActionParameters
  | RapUnlockActionParameters
  | RapClaimClaimableActionParameters;

export interface RapActionTransaction {
  hash: string | null;
}

export type RapActionParameterMap = {
  swap: RapSwapActionParameters<'swap'>;
  crosschainSwap: RapSwapActionParameters<'crosschainSwap'>;
  unlock: RapUnlockActionParameters;
  claim: RapClaimActionParameters;
  claimBridge: RapClaimActionParameters;
  claimClaimable: RapClaimClaimableActionParameters;
};

export interface RapAction<T extends RapActionTypes> {
  parameters: RapActionParameterMap[T];
  transaction: RapActionTransaction;
  type: T;
}

export interface Rap {
  actions: RapAction<'swap' | 'crosschainSwap' | 'unlock' | 'claim' | 'claimBridge' | 'claimClaimable'>[];
}

export enum rapActions {
  swap = 'swap',
  crosschainSwap = 'crosschainSwap',
  unlock = 'unlock',
  claim = 'claim',
  claimBridge = 'claimBridge',
  claimClaimable = 'claimClaimable',
}

export type RapActionTypes = keyof typeof rapActions;

export enum rapTypes {
  swap = 'swap',
  crosschainSwap = 'crosschainSwap',
  claimBridge = 'claimBridge',
  claimClaimable = 'claimClaimable',
}

export type RapTypes = keyof typeof rapTypes;

export interface RapActionResponse {
  baseNonce?: number | null;
  errorMessage: string | null;
  hash?: string | null;
}

export interface RapActionResult {
  nonce?: number | undefined;
  hash?: string | undefined;
}

export interface ActionProps<T extends RapActionTypes> {
  baseNonce?: number;
  index: number;
  parameters: RapActionParameterMap[T];
  wallet: Signer;
  currentRap: Rap;
  gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;
  gasFeeParamsBySpeed: SwapsGasFeeParamsBySpeed | GasFeeParamsBySpeed | LegacyGasFeeParamsBySpeed;
}

export interface WalletExecuteRapProps {
  rapActionParameters: RapSwapActionParameters<'swap' | 'crosschainSwap' | 'claimBridge' | 'claimClaimable'>;
  type: RapTypes;
}
