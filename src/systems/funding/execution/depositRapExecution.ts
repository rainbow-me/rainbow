import { type Signer } from '@ethersproject/abstract-signer';
import { ethers } from 'ethers';

import { type ParsedAsset } from '@/__swaps__/types/assets';
import { estimateGasWithPadding, getProvider, toHex } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { walletExecuteRap } from '@/raps/execute';
import { rapTypes, type RapSwapActionParameters } from '@/raps/references';
import erc20ABI from '@/references/erc20-abi.json';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { type ChainId } from '@/state/backendNetworks/types';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { getUniqueId } from '@/utils/ethereumUtils';
import { type CrosschainQuote, type Quote } from '@rainbow-me/swaps';

import {
  type DepositConfig,
  type DepositGasParams,
  type DepositMeteorologyActions,
  type DepositSuccessMetadata,
  type DepositToken,
} from '../types';
import { determineStrategy, type ExecutionStrategy } from './strategy';

// ============ Types ========================================================= //

type GasFeeParamsBySpeed = NonNullable<ReturnType<DepositMeteorologyActions['getGasSuggestions']>>;

type ExecutionParams = {
  assetChainId: ChainId;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  gasParams: DepositGasParams;
  nonce: number;
  parameters: Omit<
    RapSwapActionParameters<rapTypes.crosschainSwap | rapTypes.swap>,
    'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'
  >;
  wallet: Signer;
};

export type ExecuteDepositRapParams = {
  asset: RapSwapActionParameters<rapTypes.swap>['assetToSell'];
  assetChainId: ChainId;
  config: Pick<DepositConfig, 'directTransferEnabled' | 'to'>;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed;
  gasParams: DepositGasParams;
  nonce: number;
  quote: Quote | CrosschainQuote;
  wallet: Signer;
};

export type ExecuteDepositRapResult =
  | { error: string; success: false }
  | {
      executionStrategy: Exclude<DepositSuccessMetadata['executionStrategy'], 'custom'>;
      hash: string;
      isConfirmed: boolean;
      success: true;
    };

// ============ Public ======================================================== //

export async function executeDepositRap({
  asset,
  assetChainId,
  config,
  gasFeeParamsBySpeed,
  gasParams,
  nonce,
  quote,
  wallet,
}: ExecuteDepositRapParams): Promise<ExecuteDepositRapResult> {
  const strategy = determineStrategy(config, quote, quote.from);

  const parameters: Omit<
    RapSwapActionParameters<rapTypes.crosschainSwap | rapTypes.swap>,
    'gasFeeParamsBySpeed' | 'gasParams' | 'selectedGasFee'
  > = {
    assetToBuy: buildTargetParsedAsset(config.to.token, config.to.chainId),
    assetToSell: asset,
    buyAmount: quote.buyAmount?.toString(),
    chainId: assetChainId,
    quote,
    sellAmount: quote.sellAmount?.toString(),
  };

  const result = await executeTransaction(strategy, {
    assetChainId,
    gasFeeParamsBySpeed,
    gasParams,
    nonce,
    parameters,
    wallet,
  });

  if (!result.success) return result;

  return {
    executionStrategy: strategy.type === 'directTransfer' ? 'directTransfer' : strategy.rapType,
    hash: result.hash,
    isConfirmed: result.isConfirmed,
    success: true,
  };
}

// ============ Transaction Execution ========================================= //

type ExecutionResult =
  | { error: string; hash?: undefined; isConfirmed?: undefined; success: false }
  | { error?: undefined; hash: string; isConfirmed: boolean; success: true };

async function executeTransaction(strategy: ExecutionStrategy, params: ExecutionParams): Promise<ExecutionResult> {
  switch (strategy.type) {
    case 'directTransfer':
      return executeDirectTransfer(params, strategy.recipient);
    case 'swap':
      return executeSwap(params, strategy.rapType);
  }
}

async function executeSwap(params: ExecutionParams, rapType: 'crosschainSwap' | 'swap'): Promise<ExecutionResult> {
  const { errorMessage, hash } = await executeFn(walletExecuteRap, {
    operation: TimeToSignOperation.SignTransaction,
    screen: Screens.FUNDING_DEPOSIT,
  })(params.wallet, rapType === 'crosschainSwap' ? rapTypes.crosschainSwap : rapTypes.swap, {
    ...params.parameters,
    chainId: params.assetChainId,
    gasFeeParamsBySpeed: params.gasFeeParamsBySpeed,
    gasParams: params.gasParams,
    nonce: params.nonce,
  });

  if (errorMessage || !hash) {
    if (errorMessage && errorMessage !== 'handled') {
      const extractedError = errorMessage.split('[')[0];
      return { error: extractedError, success: false };
    }
    return { error: errorMessage ?? 'No transaction hash returned', success: false };
  }

  return { hash, isConfirmed: false, success: true };
}

async function executeDirectTransfer(params: ExecutionParams, recipient: string): Promise<ExecutionResult> {
  try {
    const provider = getProvider({ chainId: params.assetChainId });
    const tokenAddress = params.parameters.assetToSell.address;
    const amount = params.parameters.sellAmount ?? '0';
    const token = new ethers.Contract(tokenAddress, erc20ABI, params.wallet.connect(provider));

    const gasLimit = await estimateGasWithPadding(
      {
        data: token.interface.encodeFunctionData('transfer', [recipient, amount]),
        from: await params.wallet.getAddress(),
        to: tokenAddress,
      },
      undefined,
      null,
      provider,
      1.2
    );

    const tx = await token.transfer(recipient, amount, {
      ...params.gasParams,
      gasLimit: gasLimit ? toHex(gasLimit) : undefined,
      nonce: params.nonce,
    });

    return { hash: tx.hash, isConfirmed: false, success: true };
  } catch (error) {
    logger.error(new RainbowError('[depositRapExecution]: directTransfer failed', error));
    return { error: 'Transfer failed. Please try again.', success: false };
  }
}

// ============ Asset Building ================================================ //

function buildTargetParsedAsset(token: DepositToken, chainId: ChainId): ParsedAsset {
  const chainNames = useBackendNetworksStore.getState().getChainsName();
  return {
    address: token.address,
    chainId,
    chainName: chainNames[chainId],
    colors: {
      fallback: '#FFFFFF',
      primary: '#2775CA',
    },
    decimals: token.decimals,
    icon_url: token.iconUrl,
    isNativeAsset: false,
    name: token.symbol,
    native: {
      price: {
        amount: 1,
        change: '0',
        display: '$1',
      },
    },
    networks: {
      [chainId]: {
        address: token.address,
        decimals: token.decimals,
      },
    },
    price: {
      value: 1,
    },
    symbol: token.symbol,
    uniqueId: getUniqueId(token.address, chainId),
  };
}
