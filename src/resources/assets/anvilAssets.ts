import { type Address } from 'viem';

import { ChainId } from '@/features/network/types/backendNetworks';
import { getErc20Balance } from '@/features/token/data/api/erc20Read';
import { getProvider } from '@/handlers/web3';
import { logger, RainbowError } from '@/logger';
import { ETH_ADDRESS } from '@/references/constants';
import { anvilAssets } from '@/references/testnet-assets-by-chain';
import { type UserAsset } from '@/state/assets/types';

/**
 * Fetches balances for the mainnet assets configured for Anvil. Logs RPC failures and returns an empty list.
 */
export async function fetchAnvilUserAssets(address: Address): Promise<UserAsset[]> {
  const provider = getProvider({ chainId: ChainId.mainnet });

  try {
    return await Promise.all(
      anvilAssets.map(async asset => {
        const balance =
          asset.address === ETH_ADDRESS
            ? await provider.getBalance(address)
            : await getErc20Balance({ owner: address, provider, tokenAddress: asset.address });

        return { asset, quantity: balance.toString(), smallBalance: false, value: '0' };
      })
    );
  } catch (error) {
    logger.error(new RainbowError(`[anvilAssets]: Error fetching balances from Anvil node: ${error}`));
    return [];
  }
}
