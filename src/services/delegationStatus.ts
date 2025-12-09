import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { Address } from 'viem';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getProviderViem } from '@/handlers/web3';
import { getHasAnyDelegation, getIsDelegatedToAddress } from '@rainbow-me/delegation';

// Mocked delegation config data
// Format: { [chainId: string]: contractAddress }
const DELEGATION_CONFIG: Record<string, string> = {};

interface DelegationToRevoke {
  chainId: number;
  contractAddress: string;
}

export async function isAddressDelegated(accountAddress: string, chainId: number): Promise<boolean> {
  try {
    const networks = useBackendNetworksStore.getState().getDefaultChains();
    const network = networks[chainId];

    if (!network?.rpcUrls?.default?.http?.[0]) {
      return false;
    }

    const publicClient = getProviderViem({ chainId });

    return await getHasAnyDelegation({
      address: accountAddress as Address,
      publicClient,
    });
  } catch (error) {
    logger.error(new RainbowError('Failed to check if address is delegated'), {
      error,
      accountAddress,
      chainId,
    });
    return false;
  }
}

export async function isDelegatedToContract(accountAddress: string, contractAddress: string, chainId: number): Promise<boolean> {
  try {
    const networks = useBackendNetworksStore.getState().getDefaultChains();
    const network = networks[chainId];

    if (!network?.rpcUrls?.default?.http?.[0]) {
      logger.warn('No RPC URL found for chain', { chainId });
      return false;
    }

    const publicClient = getProviderViem({ chainId });

    const isDelegated = await getIsDelegatedToAddress({
      address: accountAddress as Address,
      contractAddress: contractAddress as Address,
      chainId,
      publicClient,
    });

    if (isDelegated) {
      logger.debug('Found delegation to target contract', {
        accountAddress,
        contractAddress,
        chainId,
      });
    }

    return isDelegated;
  } catch (error) {
    logger.error(new RainbowError('Failed to check delegation status'), {
      error,
      accountAddress,
      contractAddress,
      chainId,
    });
    return false;
  }
}

export async function checkDelegationStatus(): Promise<void> {
  try {
    const delegationStatus = DELEGATION_CONFIG;

    if (!delegationStatus || Object.keys(delegationStatus).length === 0) {
      return; // No delegation status data
    }

    // Get current account address
    const { accountAddress } = useWalletsStore.getState();
    if (!accountAddress) {
      return; // No account to check
    }

    const delegationsToRevoke: DelegationToRevoke[] = [];

    // Check each chain/contract pair to see if user is actually delegated
    for (const [chainIdStr, contractAddress] of Object.entries(delegationStatus)) {
      const chainId = parseInt(chainIdStr, 10);
      if (isNaN(chainId) || !contractAddress || contractAddress === '') {
        continue;
      }

      // Check if the user is actually delegated to this contract on this chain
      const isDelegated = await isDelegatedToContract(accountAddress, contractAddress, chainId);

      if (isDelegated) {
        delegationsToRevoke.push({
          chainId,
          contractAddress,
        });
        logger.info('Found active delegation', { chainId, contractAddress, accountAddress });
      }
    }

    // Only show the modal if there are actual delegations to revoke
    if (delegationsToRevoke.length > 0) {
      logger.info('Delegation status required', { delegationsToRevoke });

      // Navigate to the revoke delegation panel
      Navigation.handleAction(Routes.REVOKE_DELEGATION_PANEL, {
        delegationsToRevoke,
      });
    } else {
      logger.debug('No active delegations found for revoke');
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to check delegation status'), { error });
  }
}
