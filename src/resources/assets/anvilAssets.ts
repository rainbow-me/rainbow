import { Contract } from '@ethersproject/contracts';
import { keyBy, mapValues } from 'lodash';
import { getProvider } from '@/handlers/web3';
import { balanceCheckerContractAbi, chainAssets, ETH_ADDRESS, erc20ABI } from '@/references';
import { parseAddressAsset } from './assets';
import { RainbowAddressAssets } from './types';
import { logger, RainbowError } from '@/logger';
import { AddressOrEth, UniqueId, ZerionAsset } from '@/__swaps__/types/assets';
import { AddressZero } from '@ethersproject/constants';
import chainAssetsByChainId from '@/references/testnet-assets-by-chain';
import { ChainId, ChainName, Network } from '@/state/backendNetworks/types';
import { useBackendNetworksStore } from '@/state/backendNetworks/backendNetworks';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';
import { ethers } from 'ethers';

const fetchAnvilBalancesWithBalanceChecker = async (
  tokens: string[],
  address: string,
  chainId: ChainId
): Promise<{ [tokenAddress: string]: string } | null> => {
  const provider = getProvider({ chainId });
  const connectedToAnvil = useConnectedToAnvilStore.getState().connectedToAnvil;

  if (!connectedToAnvil) {
    const MAINNET_BALANCE_CHECKER = '0x4dcf4562268dd384fe814c00fad239f06c2a0c2b';
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
  }

  try {
    const balances: { [tokenAddress: string]: string } = {};
    const balancePromises = tokens.map(tokenAddr => {
      if (tokenAddr === AddressZero) {
        // This is for ETH
        return provider.getBalance(address);
      } else {
        const tokenContract = new Contract(tokenAddr, erc20ABI, provider);
        return tokenContract.balanceOf(address);
      }
    });

    const results = await Promise.all(balancePromises);
    tokens.forEach((tokenAddr, tokenIdx) => {
      const balance = results[tokenIdx];
      const assetCode = tokenAddr === AddressZero ? ETH_ADDRESS : tokenAddr;
      balances[assetCode] = balance.toString();
    });
    return balances;
  } catch (e) {
    logger.error(new RainbowError(`[anvilAssets]: Error fetching balances from Anvil node: ${e}`));

    // Fallback: return configured quantities for testnet when balance checks fail
    // This ensures tokens are available immediately for testing without requiring live contracts
    const FALLBACK_ETH_BALANCE = ethers.utils.parseEther('10').toString(); // 10 ETH for gas
    const FALLBACK_POL_BALANCE = ethers.utils.parseEther('10000').toString(); // 10,000 POL tokens
    const POL_TOKEN_ADDRESS = '0x0000000000000000000000000000000000001010';

    const fallbackBalances: { [tokenAddress: string]: string } = {};
    tokens.forEach(tokenAddr => {
      const assetCode = tokenAddr === AddressZero ? ETH_ADDRESS : tokenAddr;

      if (tokenAddr === AddressZero) {
        fallbackBalances[assetCode] = FALLBACK_ETH_BALANCE;
      } else if (tokenAddr === POL_TOKEN_ADDRESS) {
        fallbackBalances[assetCode] = FALLBACK_POL_BALANCE;
      } else {
        fallbackBalances[assetCode] = '0';
      }
    });
    return fallbackBalances;
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
  const balances = await fetchAnvilBalancesWithBalanceChecker(tokenAddresses, accountAddress, chainId);
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

  const balances = await fetchAnvilBalancesWithBalanceChecker(tokenAddresses, accountAddress, chainId);
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
