import { Contract } from '@ethersproject/contracts';
import { captureException } from '@sentry/react-native';
import { keyBy, mapValues } from 'lodash';
import { Network } from '@/helpers/networkTypes';
import { web3Provider } from '@/handlers/web3'; // TODO JIN
import { getNetworkObj } from '@/networks';
import {
  balanceCheckerContractAbi,
  chainAssets,
  ETH_ADDRESS,
} from '@/references';
import { parseAddressAsset } from './assets';
import { RainbowAddressAssets } from './types';
import logger from '@/utils/logger';

const ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT =
  '0x0000000000000000000000000000000000000000';

const fetchHardhatBalancesWithBalanceChecker = async (
  tokens: string[],
  address: string,
  network: Network = Network.mainnet
): Promise<{ [tokenAddress: string]: string } | null> => {
  const balanceCheckerContract = new Contract(
    getNetworkObj(network).balanceCheckerAddress,
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances: {
      [tokenAddress: string]: string;
    } = {};
    tokens.forEach((tokenAddr, tokenIdx) => {
      const balance = values[tokenIdx];
      const assetCode =
        tokenAddr === ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
          ? ETH_ADDRESS
          : tokenAddr;
      balances[assetCode] = balance.toString();
    });
    return balances;
  } catch (e) {
    logger.sentry(
      'Error fetching balances from balanceCheckerContract',
      network,
      e
    );
    captureException(new Error('fallbackExplorer::balanceChecker failure'));
    return null;
  }
};

export const fetchHardhatBalances = async (
  accountAddress: string,
  network: Network = Network.mainnet
): Promise<RainbowAddressAssets | null> => {
  const chainAssetsMap = keyBy(
    chainAssets[network as keyof typeof chainAssets],
    'asset.asset_code'
  );

  const tokenAddresses = Object.values(
    chainAssetsMap
  ).map(({ asset: { asset_code } }) =>
    asset_code === ETH_ADDRESS
      ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
      : asset_code.toLowerCase()
  );
  const balances = await fetchHardhatBalancesWithBalanceChecker(
    tokenAddresses,
    accountAddress,
    network
  );
  if (!balances) return null;

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
