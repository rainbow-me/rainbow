import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { logger, RainbowError } from '@/logger';
import haptics from '@/utils/haptics';
import { executeRevokeDelegation } from '@rainbow-me/delegation';
import { loadWallet } from '@/model/wallet';
import { getProvider } from '@/handlers/web3';
import { getNextNonce } from '@/state/nonces';
import type { ChainId } from '@/state/backendNetworks/types';
import { getMeteorologyCachedData } from '@/__swaps__/utils/meteorology';
import { isLegacyMeteorologyFeeData } from '@/resources/meteorology/classification';
import { userAssetsStore } from '@/state/assets/userAssets';
import type { RevokeStatus, ChainRevokeStatus } from './types';

type LoadedWallet = Exclude<Awaited<ReturnType<typeof loadWallet>>, null>;
type ChainWithId = { chainId: number };

type PartitionGasChainsArgs = {
  chains: ChainWithId[];
  address: string | undefined;
  getNativeAssetBalance: (chainId: ChainId) => string | number | null | undefined;
  getChainBalance: (chainId: ChainId, address: string) => Promise<bigint>;
};

export async function partitionChainsByGasAvailability({
  chains,
  address,
  getNativeAssetBalance,
  getChainBalance,
}: PartitionGasChainsArgs): Promise<{ insufficientGasChainIds: number[]; actionableChains: ChainWithId[] }> {
  const insufficientGasChainIds: number[] = [];
  const actionableChains: ChainWithId[] = [];

  for (const d of chains) {
    const chainId = d.chainId as ChainId;
    const nativeAssetBalance = getNativeAssetBalance(chainId);

    if (nativeAssetBalance != null && Number(nativeAssetBalance) <= 0) {
      insufficientGasChainIds.push(d.chainId);
      continue;
    }
    if (nativeAssetBalance != null && Number(nativeAssetBalance) > 0) {
      actionableChains.push(d);
      continue;
    }

    if (!address) {
      actionableChains.push(d);
      continue;
    }

    try {
      const onchainBalance = await getChainBalance(chainId, address);
      if (onchainBalance <= 0n) insufficientGasChainIds.push(d.chainId);
      else actionableChains.push(d);
    } catch {
      // If balance fetch fails, keep chain actionable and let execution return the real failure reason.
      actionableChains.push(d);
    }
  }

  return { insufficientGasChainIds, actionableChains };
}

// ─── Helpers ─────────────────────────────────────────────────────────

/** Per-chain revocation status tracking. Aggregates individual ChainRevokeStatus values (see ./types) into a single RevokeStatus. */
function useChainsStatus(delegationsToRevoke: { chainId: number }[]) {
  const [chainStatuses, setChainStatuses] = useState<Record<number, ChainRevokeStatus>>(() =>
    Object.fromEntries(delegationsToRevoke.map(d => [d.chainId, 'pending']))
  );
  const [success, setSuccess] = useState(false);

  const delegationChainIds = useMemo(
    () =>
      delegationsToRevoke
        .map(d => d.chainId)
        .sort()
        .join(','),
    [delegationsToRevoke]
  );

  useEffect(() => {
    setChainStatuses(Object.fromEntries(delegationsToRevoke.map(d => [d.chainId, 'pending'])));
    setSuccess(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegationChainIds]);

  const revokeStatus: RevokeStatus = useMemo(() => {
    if (success) return 'success';
    const statuses = Object.values(chainStatuses);
    if (statuses.length === 0) return 'ready';
    if (statuses.some(s => s === 'revoking')) return 'revoking';
    if (statuses.every(s => s === 'success')) return 'success';
    if (statuses.some(s => s === 'insufficientGas') && statuses.every(s => s === 'insufficientGas' || s === 'success'))
      return 'insufficientGas';
    if (statuses.some(s => s === 'error' || s === 'insufficientGas')) return 'error';
    return 'ready';
  }, [chainStatuses, success]);

  const setChainStatus = useCallback((status: ChainRevokeStatus | 'success', chainIds?: Iterable<number>) => {
    if (!chainIds) {
      if (status === 'success') setSuccess(true);
      return;
    }
    setChainStatuses(prev => {
      const next = { ...prev };
      for (const cid of chainIds) {
        if (status === 'insufficientGas' && next[cid] === 'success') continue;
        next[cid] = status as ChainRevokeStatus;
      }
      return next;
    });
  }, []);

  const mergeChainStatuses = useCallback((results: Record<number, ChainRevokeStatus>) => {
    setChainStatuses(prev => ({ ...prev, ...results }));
  }, []);

  return {
    revokeStatus,
    chainStatuses,
    setChainStatus,
    mergeChainStatuses,
  };
}

/** Partitions chains by native gas balance via userAssetsStore (src/state/assets/userAssets). */
function useActionableChains(address: string | undefined) {
  return useCallback(
    async (chains: { chainId: number }[]) => {
      return await partitionChainsByGasAvailability({
        chains,
        address,
        getNativeAssetBalance: chainId => {
          const nativeAsset = userAssetsStore.getState().getNativeAssetForChain(chainId);
          return nativeAsset?.balance?.amount;
        },
        getChainBalance: async (chainId, chainAddress) => {
          const provider = getProvider({ chainId });
          const onchainBalance = await provider.getBalance(chainAddress);
          return onchainBalance.toBigInt();
        },
      });
    },
    [address]
  );
}

/** Fires revocations in parallel via executeRevokeDelegation (@rainbow-me/delegation). Uses getMeteorologyCachedData for EIP-1559 fees and getNextNonce (src/state/nonces) per chain. */
async function executeRevokeAll(
  chains: { chainId: number }[],
  address: string,
  wallet: LoadedWallet
): Promise<{ chainStatuses: Record<number, ChainRevokeStatus>; anyFailed: boolean }> {
  const results = await Promise.allSettled(
    chains.map(async d => {
      const chainId = d.chainId as ChainId;
      // Reconnect the wallet to this chain's provider so the signer targets the right RPC
      const chainProvider = getProvider({ chainId });
      const chainSigner = wallet.connect(chainProvider);

      const cachedMeteorology = getMeteorologyCachedData(chainId);
      let maxFeePerGas: bigint | undefined;
      let maxPriorityFeePerGas: bigint | undefined;

      if (cachedMeteorology && !isLegacyMeteorologyFeeData(cachedMeteorology)) {
        maxFeePerGas = BigInt(cachedMeteorology.data.baseFeeSuggestion) + BigInt(cachedMeteorology.data.maxPriorityFeeSuggestions.fast);
        maxPriorityFeePerGas = BigInt(cachedMeteorology.data.maxPriorityFeeSuggestions.fast);
      }

      const nonce = await getNextNonce({ address, chainId });
      const result = await executeRevokeDelegation({
        // @ts-expect-error SDK SignerLike requires privateKey; ethers signer satisfies this at runtime
        signer: chainSigner,
        provider: chainProvider,
        chainId,
        // Allow undefined fees so SDK/provider can apply fallback values.
        transactionOptions: { maxFeePerGas, maxPriorityFeePerGas, gasLimit: null } as unknown as {
          maxFeePerGas: bigint;
          maxPriorityFeePerGas: bigint;
          gasLimit: bigint | null;
        },
        nonce,
      });

      logger.info('Delegation removed successfully', { hash: result.hash, chainId });
      return { chainId };
    })
  );

  const chainStatuses: Record<number, ChainRevokeStatus> = {};
  let anyFailed = false;
  results.forEach((r, i) => {
    const cid = chains[i].chainId;
    if (r.status === 'fulfilled') {
      chainStatuses[cid] = 'success';
    } else {
      chainStatuses[cid] = 'error';
      anyFailed = true;
      logger.error(new RainbowError('Failed to revoke delegation'), {
        error: r.reason,
        chainId: cid,
      });
    }
  });

  return { chainStatuses, anyFailed };
}

// ─── Hook ────────────────────────────────────────────────────────────

type UseRevokeDelegationParams = {
  address: string | undefined;
  delegationsToRevoke: { chainId: number }[];
  onSuccess: (() => void) | undefined;
};

type UseRevokeDelegationResult = {
  revokeStatus: RevokeStatus;
  handleRevoke: () => void;
  revokeCount: number;
};

export function useRevokeDelegation({ address, delegationsToRevoke, onSuccess }: UseRevokeDelegationParams): UseRevokeDelegationResult {
  const { revokeStatus, chainStatuses, setChainStatus, mergeChainStatuses } = useChainsStatus(delegationsToRevoke);
  const getActionableChains = useActionableChains(address);

  const revokeChains = useCallback(
    async (chains: { chainId: number }[]) => {
      if (!address || chains.length === 0) return;

      const { insufficientGasChainIds, actionableChains } = await getActionableChains(chains);
      if (actionableChains.length === 0) {
        setChainStatus('insufficientGas', insufficientGasChainIds);
        return;
      }

      setChainStatus(
        'revoking',
        actionableChains.map(d => d.chainId)
      );
      setChainStatus('insufficientGas', insufficientGasChainIds);

      // Load wallet once so biometrics only prompts a single time
      const provider = getProvider({ chainId: actionableChains[0].chainId as ChainId });
      const wallet = await loadWallet({ address, provider });
      if (!wallet) {
        setChainStatus(
          'error',
          actionableChains.map(d => d.chainId)
        );
        haptics.notificationError();
        return;
      }

      const { chainStatuses: newStatuses, anyFailed } = await executeRevokeAll(actionableChains, address, wallet);
      mergeChainStatuses(newStatuses);
      haptics[anyFailed ? 'notificationError' : 'notificationSuccess']();
    },
    [address, getActionableChains, setChainStatus, mergeChainStatuses]
  );

  const handleRetry = useCallback(async () => {
    const failedChains = delegationsToRevoke.filter(d => chainStatuses[d.chainId] === 'error');
    if (failedChains.length === 0) return;
    await revokeChains(failedChains);
  }, [delegationsToRevoke, chainStatuses, revokeChains]);

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;
  useEffect(() => {
    if (revokeStatus === 'success') {
      onSuccessRef.current?.();
    }
  }, [revokeStatus]);

  const handleRevoke = useCallback(() => {
    if (revokeStatus === 'ready') {
      if (delegationsToRevoke.length === 0) {
        setChainStatus('success');
        return;
      }
      revokeChains(delegationsToRevoke);
    } else if (revokeStatus === 'error') {
      handleRetry();
    }
  }, [revokeStatus, delegationsToRevoke, setChainStatus, revokeChains, handleRetry]);

  return {
    revokeStatus,
    handleRevoke,
    revokeCount: delegationsToRevoke.length,
  };
}
