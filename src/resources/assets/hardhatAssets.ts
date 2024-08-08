import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { keyBy, mapValues } from 'lodash';
import { Network } from '@/helpers/networkTypes';
import { web3Provider } from '@/handlers/web3'; // TODO JIN
import { getNetworkObj } from '@/networks';
import { balanceCheckerContractAbi, chainAssets, chainAssetsByChainId, ETH_ADDRESS, SUPPORTED_CHAIN_IDS } from '@/references';
import { parseAddressAsset } from './assets';
import { RainbowAddressAssets } from './types';
import logger from '@/utils/logger';
import { AddressZero } from '@ethersproject/constants';

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
    logger.sentry('Error fetching balances from balanceCheckerContract', network, e);
    captureException(new Error('fallbackExplorer::balanceChecker failure'));
    return null;
  }
};

export const fetchHardhatBalances = async (accountAddress: string, network: Network = Network.mainnet): Promise<RainbowAddressAssets> => {
  const chainAssetsMap = keyBy(chainAssets[network as keyof typeof chainAssets], ({ asset }) => `${asset.asset_code}_${asset.network}`);

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

export const fetchHardhatBalancesByChainId = async (accountAddress: string): Promise<RainbowAddressAssets> => {
  const chainIds = SUPPORTED_CHAIN_IDS({ testnetMode: true });
  const tokenAddresses: string[] = [];
  const chainAssetsMap: Record<string, any> = {};

  chainIds.forEach(chainId => {
    const chainAssets = chainAssetsByChainId[chainId] || [];
    chainAssets.forEach(asset => {
      const assetCode = asset.asset.address;
      const tokenAddress = assetCode === ETH_ADDRESS ? AddressZero : assetCode.toLowerCase();
      tokenAddresses.push(tokenAddress);
      chainAssetsMap[tokenAddress] = { ...asset, asset_code: assetCode };
    });
  });

  const balances = await fetchHardhatBalancesWithBalanceChecker(tokenAddresses, accountAddress, Network.mainnet);
  if (!balances) return {};

  const updatedAssets = Object.entries(balances).reduce((acc, [tokenAddress, balance]) => {
    const chainAsset = chainAssetsMap[tokenAddress];
    if (chainAsset) {
      const assetCode = chainAsset.asset.asset_code.toLowerCase();
      const updatedAsset = {
        asset: {
          ...chainAsset.asset,
          network: chainAsset.asset.network as Network,
        },
        quantity: balance,
      };
      acc[assetCode] = parseAddressAsset({ assetData: updatedAsset });
    }
    return acc;
  }, {} as RainbowAddressAssets);

  return updatedAssets;
};
