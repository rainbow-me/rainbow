import { getRemoteConfig } from '@/model/remoteConfig';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import { logger, RainbowError } from '@/logger';
import { useWalletsStore } from '@/state/wallets/walletsStore';
import { getAddress } from 'viem';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { getProviderViem } from '@/handlers/web3';

interface DelegationToRevoke {
  chainId: number;
  contractAddress: string;
}

async function isDelegatedToContract(accountAddress: string, contractAddress: string, chainId: number): Promise<boolean> {
  try {
    const networks = useBackendNetworksStore.getState().getDefaultChains();
    const network = networks[chainId];

    if (!network?.rpcUrls?.default?.http?.[0]) {
      logger.warn('No RPC URL found for chain', { chainId });
      return false;
    }

    const publicClient = getProviderViem({ chainId });

    const code = await publicClient.getCode({
      address: getAddress(accountAddress),
    });

    if (!code || code === '0x') {
      return false;
    }

    const targetAddress = contractAddress.toLowerCase().replace('0x', '');
    const codeString = code.toLowerCase();

    const isDelegatedToTarget = codeString.includes(targetAddress);

    if (isDelegatedToTarget) {
      logger.debug('Found delegation to target contract', {
        accountAddress,
        contractAddress,
        chainId,
        codeLength: code.length,
      });
    }

    return isDelegatedToTarget;
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

export async function checkDedelegation(): Promise<void> {
  try {
    const config = getRemoteConfig();
    const dedelegationData = config.dedelegation;

    if (!dedelegationData || Object.keys(dedelegationData).length === 0) {
      return; // No dedelegation data
    }

    // Get current account address
    const { accountAddress } = useWalletsStore.getState();
    if (!accountAddress) {
      return; // No account to check
    }

    const delegationsToRevoke: DelegationToRevoke[] = [];

    // Check each chain/contract pair to see if user is actually delegated
    for (const [chainIdStr, contractAddress] of Object.entries(dedelegationData)) {
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
      logger.info('Dedelegation required', { delegationsToRevoke });

      // Navigate to the dedelegation panel
      Navigation.handleAction(Routes.DEDELEGATION_PANEL, {
        delegationsToRevoke,
      });
    } else {
      logger.debug('No active delegations found for dedelegation');
    }
  } catch (error) {
    logger.error(new RainbowError('Failed to check dedelegation'), { error });
  }
}

export function hasDedelegationData(): boolean {
  try {
    const config = getRemoteConfig();
    const dedelegationData = config.dedelegation;
    return dedelegationData && Object.keys(dedelegationData).length > 0;
  } catch {
    return false;
  }
}
