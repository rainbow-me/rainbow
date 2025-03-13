import { TransactionRequest } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { Address, formatUnits } from 'viem';
import { analyticsV2 } from '@/analytics';
import { NativeCurrencyKey, NewTransaction, TransactionStatus } from '@/entities';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import showWalletErrorAlert from '@/helpers/support';
import { add, convertAmountToNativeDisplayWorklet, multiply, formatNumber } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { weiToGwei } from '@/parsers';
import { TransactionClaimable } from '@/resources/addys/claimables/types';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';

export interface GasInfo {
  gasFeeDisplay: string | undefined;
  gasLimit: string | undefined;
  sufficientFundsForGas: boolean;
}

interface ClaimableTransactionData {
  airdropId: string;
  amount: string;
  chainId: ChainId;
  data: string;
  symbol: string;
  to: Address;
  usdValue: number;
}

/**
 * Executes an airdrop claim transaction.
 */
export async function executeAirdropClaim({
  accountAddress,
  claimable,
  gasLimit,
  gasSettings,
}: {
  accountAddress: string;
  claimable: TransactionClaimable;
  gasLimit: string;
  gasSettings: GasSettings;
}): Promise<{ error?: string; success: boolean; txHash?: string }> {
  const { airdropId, amount, chainId, data, symbol, to, usdValue } = getClaimableTransactionData(claimable);

  const txPayload: TransactionRequest = {
    chainId,
    data,
    from: accountAddress,
    gasLimit: toHex(gasLimit),
    nonce: await getNextNonce({ address: accountAddress, chainId }),
    to,
    value: '0x0',
  };

  if (gasSettings.isEIP1559) {
    txPayload.type = 2;
    txPayload.maxFeePerGas = add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee);
    txPayload.maxPriorityFeePerGas = gasSettings.maxPriorityFee;
  } else {
    txPayload.gasPrice = gasSettings.gasPrice;
  }

  const provider = getProvider({ chainId });
  let wallet: Wallet | LedgerSigner | null;

  try {
    wallet = await loadWallet({ address: accountAddress, provider });
  } catch {
    showWalletErrorAlert();
    return { error: '[claimAirdrop] Failed to load wallet', success: false };
  }

  if (!wallet) return { error: '[claimAirdrop] Biometrics auth failure', success: false };

  try {
    logger.log('[claimAirdrop]: Attempting to sign transaction', { txPayload });
    const signedTx = await wallet.signTransaction(txPayload);
    const receipt = await provider.sendTransaction(signedTx);

    // TODO: Enable in production
    // addNewTransaction(
    //   buildClaimTransaction({
    //     accountAddress,
    //     claimable,
    //     chainId,
    //     gasLimit,
    //     nonce,
    //     txHash: receipt.hash,
    //   })
    // );

    logger.log('[claimAirdrop]: Transaction successfully submitted', { chainId, hash: receipt.hash });

    analyticsV2.track(analyticsV2.event.claimClaimableSucceeded, {
      amount,
      asset: { address: to, symbol },
      chainId,
      claimableId: airdropId,
      claimableType: 'rainbowCoin',
      isSwapping: false,
      outputAsset: { address: to, symbol },
      outputChainId: chainId,
      usdValue,
    });

    return { success: true, txHash: receipt.hash };
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    const isUserCancelled =
      errorMessage.toLowerCase().includes('user denied') ||
      errorMessage.toLowerCase().includes('cancelled') ||
      errorMessage.toLowerCase().includes('rejected');

    logger.error(new RainbowError('[claimAirdrop]: Failed to execute claim transaction'), {
      isUserCancelled,
      message: errorMessage,
      txPayload,
    });

    analyticsV2.track(analyticsV2.event.claimClaimableFailed, {
      amount,
      asset: { address: to, symbol },
      chainId,
      claimableId: airdropId,
      claimableType: 'rainbowCoin',
      errorMessage,
      failureStep: 'claim',
      isSwapping: false,
      outputAsset: { address: to, symbol },
      outputChainId: chainId,
      usdValue,
    });

    return { error: errorMessage, success: false };
  }
}

/**
 * Extracts transaction data from a claimable.
 */
function getClaimableTransactionData(claimable: TransactionClaimable): ClaimableTransactionData {
  return {
    airdropId: claimable.uniqueId,
    amount: claimable.value.claimAsset.amount,
    chainId: claimable.chainId,
    data: claimable.action.data,
    symbol: claimable.asset.symbol,
    to: claimable.action.to,
    usdValue: claimable.value.usd,
  };
}

/**
 * Estimates gas limit for an airdrop claim transaction.
 */
export async function getAirdropClaimGasLimit(claimable: TransactionClaimable, accountAddress: string): Promise<string | undefined> {
  try {
    const { chainId, data, to } = getClaimableTransactionData(claimable);
    const provider = getProvider({ chainId });
    return (await provider.estimateGas({ data, from: accountAddress, to })).toString();
  } catch (error) {
    logger.warn('[estimateAirdropClaimGas]: Failed to estimate gas limit', { claimableId: claimable.uniqueId, error });
    return undefined;
  }
}

/**
 * Provides gas-related metadata for a transaction.
 */
export async function getGasInfo({
  gasLimit,
  chainId,
  gasSettings,
  nativeCurrency,
}: {
  gasLimit: string | undefined;
  chainId: ChainId;
  gasSettings: GasSettings;
  nativeCurrency: NativeCurrencyKey;
}): Promise<GasInfo> {
  if (!gasLimit || gasLimit === '0') return { gasFeeDisplay: undefined, gasLimit: undefined, sufficientFundsForGas: false };

  const chainNativeAsset = useBackendNetworksStore.getState().getChainsNativeAsset()[chainId];
  const gasFeeWei = calculateGasFeeWorklet(gasSettings, gasLimit);
  const gasFeeNativeToken = formatUnits(safeBigInt(gasFeeWei), chainNativeAsset.decimals);
  const userNativeAsset = userAssetsStore.getState().getNativeAssetForChain(chainId);
  const nativeAssetBalance = userNativeAsset?.balance?.amount || '0';
  const nativeAssetPrice = userNativeAsset?.price?.value?.toString();

  let gasFeeDisplay;

  if (!nativeAssetPrice) {
    gasFeeDisplay = `${formatNumber(weiToGwei(gasFeeWei))} Gwei`;
  } else {
    const feeInUserCurrency = multiply(nativeAssetPrice, gasFeeNativeToken);
    gasFeeDisplay = convertAmountToNativeDisplayWorklet(feeInUserCurrency, nativeCurrency, true);
  }

  return {
    gasFeeDisplay,
    gasLimit,
    sufficientFundsForGas: lessThanOrEqualToWorklet(gasFeeNativeToken, nativeAssetBalance),
  };
}

/**
 * Converts a decimal value to hexadecimal string with '0x' prefix.
 */
function toHex(value: string | number): string {
  try {
    if (typeof value === 'string') {
      // If it's already a hex string, return it
      if (value.startsWith('0x')) return value;

      // Convert decimal string to BigInt and then to hex
      return '0x' + BigInt(value).toString(16);
    }

    // Convert number to hex
    return '0x' + Math.floor(value).toString(16);
  } catch (e) {
    logger.warn('[AirdropClaim]: Failed to convert value to hex', { error: e, value });
    return '0x0';
  }
}

/**
 * Builds a properly typed transaction object for airdrop claims
 */
function buildClaimTransaction({
  accountAddress,
  claimable,
  chainId,
  gasLimit,
  nonce,
  txHash,
}: {
  accountAddress: Address | string;
  claimable: TransactionClaimable;
  chainId: ChainId;
  gasLimit: string;
  nonce: number;
  txHash: string;
}): { address: Address | string; chainId: ChainId; transaction: NewTransaction } {
  return {
    address: accountAddress,
    chainId,
    transaction: {
      amount: '0x0',
      asset: claimable.asset,
      chainId,
      from: accountAddress,
      gasLimit,
      hash: txHash,
      network: useBackendNetworksStore.getState().getChainsName()[chainId],
      nonce,
      status: TransactionStatus.pending,
      to: claimable.action.to,
      type: 'claim',
    },
  };
}
