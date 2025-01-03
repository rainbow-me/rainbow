import { Contract } from '@ethersproject/contracts';
import { keyBy, mapValues } from 'lodash';
import { getProvider } from '@/handlers/web3';
import { balanceCheckerContractAbi, chainAssets, ETH_ADDRESS } from '@/references';
import { parseAddressAsset } from './assets';
import { RainbowAddressAssets } from './types';
import { logger, RainbowError } from '@/logger';
import { AddressOrEth, UniqueId, ZerionAsset } from '@/__swaps__/types/assets';
import { AddressZero } from '@ethersproject/constants';
import chainAssetsByChainId from '@/references/testnet-assets-by-chain';
import { ChainId, ChainName, Network } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';

const MAINNET_BALANCE_CHECKER = '0x4dcf4562268dd384fe814c00fad239f06c2a0c2b';

const fetchAnvilBalancesWithBalanceChecker = async (
  tokens: string[],
  address: string
): Promise<{ [tokenAddress: string]: string } | null> => {
  const provider = getProvider({ chainId: ChainId.mainnet });
  const balanceCheckerContract = new Contract(MAINNET_BALANCE_CHECKER, balanceCheckerContractAbi, provider);

  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances: {
      [tokenAddress: string]: string;
    } = {};
    tokens.forEach((tokenAddr, tokenIdx) => {
      const balance = values[tokenIdx];
      const assetCode = tokenAddr === AddressZero ? ETH_ADDRESS : tokenAddr;
      balances[assetCode] = balance.toString();
    });
    return balances;
  } catch (e) {
    logger.error(new RainbowError(`[anvilAssets]: Error fetching balances from balanceCheckerContract: ${e}`));
    return null;
  }
};

/**
 * @deprecated - to be removed once rest of the app is converted to new userAssetsStore
 * Fetches the balances of the anvil assets for the given account address and network.
 * @param accountAddress - The address of the account to fetch the balances for.
 * @param network - The network to fetch the balances for.
 * @returns The balances of the anvil assets for the given account address and network.
 */
export const fetchAnvilBalances = async (accountAddress: string, chainId: ChainId = ChainId.mainnet): Promise<RainbowAddressAssets> => {
  const chainAssetsMap = keyBy(
    chainAssets[`${chainId}` as keyof typeof chainAssets],
    ({ asset }) => `${asset.asset_code}_${asset.chainId}`
  );

  const tokenAddresses = Object.values(chainAssetsMap).map(({ asset: { asset_code } }) =>
    asset_code === ETH_ADDRESS ? AddressZero : asset_code.toLowerCase()
  );
  const balances = await fetchAnvilBalancesWithBalanceChecker(tokenAddresses, accountAddress);
  if (!balances) return {};

  const updatedAssets = mapValues(chainAssetsMap, chainAsset => {
    const assetCode = chainAsset.asset.asset_code.toLowerCase();
    const updatedAsset = {
      asset: {
        ...chainAsset.asset,
        network: chainAsset.asset.network as Network,
      },
      quantity: balances[assetCode],
    };
    return parseAddressAsset({ assetData: updatedAsset });
  });
  return updatedAssets;
};

export const fetchAnvilBalancesByChainId = async (
  accountAddress: string,
  chainId: ChainId = ChainId.mainnet
): Promise<{
  assets: {
    [uniqueId: UniqueId]: {
      asset: ZerionAsset;
      quantity: string;
    };
  };
  chainIdsInResponse: ChainId[];
}> => {
  const chainAssetsMap = chainAssetsByChainId[`${chainId}` as keyof typeof chainAssets] || {};

  const tokenAddresses = Object.values(chainAssetsMap).map(({ asset }) =>
    asset.asset_code === ETH_ADDRESS ? AddressZero : asset.asset_code.toLowerCase()
  );

  const balances = await fetchAnvilBalancesWithBalanceChecker(tokenAddresses, accountAddress);
  if (!balances)
    return {
      assets: {},
      chainIdsInResponse: [],
    };

  const updatedAssets = Object.entries(chainAssetsMap).reduce(
    (acc, [uniqueId, chainAsset]) => {
      const assetCode = chainAsset.asset.asset_code || ETH_ADDRESS;
      const quantity = balances[assetCode.toLowerCase()] || '0';

      const asset: ZerionAsset = {
        ...chainAsset.asset,
        asset_code: assetCode as AddressOrEth,
        mainnet_address: (chainAsset.asset.mainnet_address as AddressOrEth) || (assetCode as AddressOrEth),
        network: (chainAsset.asset.network as ChainName) || ChainName.mainnet,
        bridging: chainAsset.asset.bridging || {
          bridgeable: false,
          networks: {},
        },
        implementations: chainAsset.asset.implementations || {},
        name: chainAsset.asset.name || 'Unknown Token',
        symbol: chainAsset.asset.symbol || 'UNKNOWN',
        decimals: typeof chainAsset.asset.decimals === 'number' ? chainAsset.asset.decimals : 18,
        icon_url: chainAsset.asset.icon_url || '',
        price: chainAsset.asset.price || { value: 0, relative_change_24h: 0 },
      };

      acc[uniqueId] = { asset, quantity };
      return acc;
    },
    {} as { [uniqueId: UniqueId]: { asset: ZerionAsset; quantity: string } }
  );

  return {
    assets: updatedAssets,
    chainIdsInResponse: useBackendNetworksStore.getState().getSupportedChainIds(),
  };
};
