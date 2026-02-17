import { Wallet } from '@ethersproject/wallet';
import { executeRevokeDelegation } from '@rainbow-me/delegation';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';

/**
 * Execute a delegation revocation on-chain.
 * Pure async — no React state, no haptics. Throws on failure.
 */
export async function revokeDelegation(chainId: number, accountAddress: string): Promise<void> {
  const provider = getProvider({ chainId });

  const wallet = await loadWallet({ address: accountAddress, provider });
  if (!wallet) {
    throw new Error('Failed to load wallet');
  }

  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas?.toBigInt() ?? 0n;
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas?.toBigInt() ?? 0n;

  const nonce = await getNextNonce({ address: accountAddress, chainId });

  await executeRevokeDelegation({
    signer: wallet as Wallet,
    address: accountAddress as `0x${string}`,
    provider,
    chainId,
    transactionOptions: {
      maxFeePerGas,
      maxPriorityFeePerGas,
      gasLimit: null,
    },
    nonce,
  });
}
