import { TransactionReceipt, TransactionRequest } from '@ethersproject/abstract-provider';
import { Wallet } from '@ethersproject/wallet';
import { Address, formatUnits } from 'viem';
import { analytics } from '@/analytics';
import { NativeCurrencyKey, NewTransaction, TransactionStatus } from '@/entities';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider, toHex } from '@/handlers/web3';
import showWalletErrorAlert from '@/helpers/support';
import { add, convertAmountToNativeDisplayWorklet, multiply, formatNumber } from '@/helpers/utilities';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { weiToGwei } from '@/parsers';
import { RainbowClaimable } from '@/resources/addys/claimables/types';
import { isStaging } from '@/resources/addys/client';
import { lessThanOrEqualToWorklet } from '@/safe-math/SafeMath';
import { userAssetsStore } from '@/state/assets/userAssets';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { ChainId } from '@/state/backendNetworks/types';
import { getNextNonce } from '@/state/nonces';
import { addNewTransaction } from '@/state/pendingTransactions';
import { GasSettings } from '@/__swaps__/screens/Swap/hooks/useCustomGas';
import { safeBigInt } from '@/__swaps__/screens/Swap/hooks/useEstimatedGasFee';
import { calculateGasFeeWorklet } from '@/__swaps__/screens/Swap/providers/SyncSwapStateAndSharedValues';
import { ethereumUtils, time } from '@/utils';

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
  usdValue: string;
}

type ExecuteAirdropClaimResult =
  | {
      error?: never;
      success: true;
      txHash: string;
    }
  | {
      error: string;
      success: false;
      txHash?: never;
    };

/**
 * Executes an airdrop claim transaction.
 */
export async function executeAirdropClaim({
  accountAddress,
  claimable,
  gasLimit,
  gasSettings,
  onConfirm,
}: {
  accountAddress: string;
  claimable: RainbowClaimable;
  gasLimit: string;
  gasSettings: GasSettings;
  onConfirm?: (receipt: TransactionReceipt) => void;
}): Promise<ExecuteAirdropClaimResult> {
  const { airdropId, amount, chainId, data, symbol, to, usdValue } = getClaimableTransactionData(claimable);
  const nonce = await getNextNonce({ address: accountAddress, chainId });

  const txPayload: TransactionRequest = {
    chainId,
    data,
    from: accountAddress,
    gasLimit: toHex(gasLimit),
    nonce,
    to,
    value: '0x0',
  };

  if (gasSettings.isEIP1559) {
    txPayload.type = 2;
    txPayload.maxFeePerGas = add(gasSettings.maxBaseFee, gasSettings.maxPriorityFee);
    txPayload.maxPriorityFeePerGas = gasSettings.maxPriorityFee;
  } else {
    txPayload.gasPrice = toHex(gasSettings.gasPrice);
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
    const signedTx = await wallet.signTransaction(txPayload);
    const receipt = await provider.sendTransaction(signedTx);

    if (!isStaging()) {
      addNewTransaction(
        buildClaimTransaction({
          accountAddress,
          claimable,
          chainId,
          gasLimit,
          nonce,
          txHash: receipt.hash,
        })
      );
    }

    logger.debug('[claimAirdrop]: Transaction successfully submitted', { chainId, hash: receipt.hash });

    analytics.track(analytics.event.claimClaimableSucceeded, {
      assets: [{ address: to, symbol, amount }],
      chainId,
      claimableId: airdropId,
      claimableType: 'rainbowCoin',
      isSwapping: false,
      outputAsset: { address: to, symbol },
      outputChainId: chainId,
      usdValue,
    });

    if (onConfirm)
      provider.waitForTransaction(receipt.hash, 1, time.minutes(1)).then(receipt => {
        onConfirm(receipt);
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
    });

    analytics.track(analytics.event.claimClaimableFailed, {
      assets: [{ address: to, symbol, amount }],
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
function getClaimableTransactionData(claimable: RainbowClaimable): ClaimableTransactionData {
  const [action] = claimable.action;
  const [asset] = claimable.assets;
  return {
    airdropId: claimable.uniqueId,
    amount: asset.amount.amount,
    chainId: claimable.chainId,
    data: action.data,
    symbol: asset.asset.symbol,
    to: action.to,
    usdValue: claimable.totalCurrencyValue.amount,
  };
}

/**
 * Estimates gas limit for an airdrop claim transaction.
 */
export async function getAirdropClaimGasLimit(claimable: RainbowClaimable, accountAddress: string): Promise<string | undefined> {
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
  const nativeAssetPrice = (userNativeAsset?.price?.value || ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId })).toString();

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
  claimable: RainbowClaimable;
  chainId: ChainId;
  gasLimit: string;
  nonce: number;
  txHash: string;
}): { address: Address | string; chainId: ChainId; transaction: NewTransaction } {
  const [action] = claimable.action;
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
      to: action.to,
      type: 'claim',
    },
  };
}
