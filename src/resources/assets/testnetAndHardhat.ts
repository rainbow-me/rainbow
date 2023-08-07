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
import logger from '@/utils/logger';

const ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT =
  '0x0000000000000000000000000000000000000000';

const fetchTestnetOrHardhatBalancesWithBalanceChecker = async (
  tokens: string[],
  address: string,
  network: Network
): Promise<{ [tokenAddress: string]: string } | null> => {
  const balanceCheckerContract = new Contract(
    getNetworkObj(network).balanceCheckerAddress,
    balanceCheckerContractAbi,
    web3Provider
  );
  try {
    const values = await balanceCheckerContract.balances([address], tokens);
    const balances: {
      [address: string]: { [tokenAddress: string]: string };
    } = {};
    [address].forEach((addr, addrIdx) => {
      balances[addr] = {};
      tokens.forEach((tokenAddr, tokenIdx) => {
        const balance = values[addrIdx * tokens.length + tokenIdx];
        balances[addr][tokenAddr] = balance.toString();
      });
    });
    return balances[address];
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

export const fetchTestnetOrHardhatBalances = async (
  accountAddress: string,
  network: Network,
  nativeCurrency: string
) => {
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
  const balances = await fetchTestnetOrHardhatBalancesWithBalanceChecker(
    tokenAddresses,
    accountAddress,
    network
  );
  if (!balances) return;

  const updatedAssets = mapValues(chainAssetsMap, assetAndQuantity => {
    const assetCode = assetAndQuantity.asset.asset_code.toLowerCase();
    return {
      asset: {
        ...assetAndQuantity.asset,
        asset_code:
          assetCode === ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
            ? ETH_ADDRESS
            : assetCode,
      },
      quantity:
        balances[
          assetCode === ETH_ADDRESS
            ? ETHEREUM_ADDRESS_FOR_BALANCE_CONTRACT
            : assetCode
        ],
    };
  });
};
