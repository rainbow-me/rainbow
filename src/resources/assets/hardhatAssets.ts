import { Contract } from '@ethersproject/contracts';
import { keyBy, mapValues } from 'lodash';
import { Network } from '@/helpers/networkTypes';
import { web3Provider } from '@/handlers/web3'; // TODO JIN
import { getNetworkObj } from '@/networks';
import { balanceCheckerContractAbi, chainAssets, ETH_ADDRESS, SUPPORTED_CHAIN_IDS } from '@/references';
import { parseAddressAsset } from './assets';
import { RainbowAddressAssets } from './types';
import { logger, RainbowError } from '@/logger';
import { AddressOrEth, UniqueId, ZerionAsset } from '@/__swaps__/types/assets';
import { ChainId, ChainName } from '@/__swaps__/types/chains';
import { AddressZero } from '@ethersproject/constants';
import chainAssetsByChainId from '@/references/testnet-assets-by-chain';

const fetchHardhatBalancesWithBalanceChecker = async (
  tokens: string[],
  address: string,
  network: Network = Network.mainnet
): Promise<{ [tokenAddress: string]: string } | null> => {
  const balanceCheckerContract = new Contract(getNetworkObj(network).balanceCheckerAddress, balanceCheckerContractAbi, web3Provider);
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
    logger.error(new RainbowError(`[hardhatAssets]: Error fetching balances from balanceCheckerContract: ${e}`));
    return null;
  }
};

/**
 * @deprecated - to be removed once rest of the app is converted to new userAssetsStore
 * Fetches the balances of the hardhat assets for the given account address and network.
 * @param accountAddress - The address of the account to fetch the balances for.
 * @param network - The network to fetch the balances for.
 * @returns The balances of the hardhat assets for the given account address and network.
 */
export const fetchHardhatBalances = async (accountAddress: string, network: Network = Network.mainnet): Promise<RainbowAddressAssets> => {
  const chainAssetsMap = keyBy(chainAssets[network as keyof typeof chainAssets], ({ asset }) => `${asset.asset_code}_${asset.chainId}`);

  const tokenAddresses = Object.values(chainAssetsMap).map(({ asset: { asset_code } }) =>
    asset_code === ETH_ADDRESS ? AddressZero : asset_code.toLowerCase()
  );
  const balances = await fetchHardhatBalancesWithBalanceChecker(tokenAddresses, accountAddress, network);
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

export const fetchHardhatBalancesByChainId = async (
  accountAddress: string,
  network: Network = Network.mainnet
): Promise<{
  assets: {
    [uniqueId: UniqueId]: {
      asset: ZerionAsset;
      quantity: string;
    };
  };
  chainIdsInResponse: ChainId[];
}> => {
  const chainAssetsMap = chainAssetsByChainId[network as keyof typeof chainAssets] || {};
  const tokenAddresses = Object.values(chainAssetsMap).map(({ asset }) =>
    asset.asset_code === ETH_ADDRESS ? AddressZero : asset.asset_code.toLowerCase()
  );

  const balances = await fetchHardhatBalancesWithBalanceChecker(tokenAddresses, accountAddress, network);
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
        decimals: chainAsset.asset.decimals || 18,
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
    chainIdsInResponse: SUPPORTED_CHAIN_IDS({ testnetMode: true }),
  };
};
