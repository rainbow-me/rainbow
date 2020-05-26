import { ethers } from 'ethers';
import { forEach, get, isEmpty, keys, map, values } from 'lodash';
import { useCallback } from 'react';
import { queryCache, useQuery } from 'react-query';
import {
  saveWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '../handlers/localstorage/walletBalances';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import { handleSignificantDecimals } from '../helpers/utilities';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import { ethereumUtils, logger } from '../utils';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

const useWalletBalances = wallets => {
  const { accountAddress, network } = useAccountSettings();
  const { assets } = useAccountAssets();
  const selectedAsset = ethereumUtils.getAsset(assets);
  const selectedAccountBalance = get(selectedAsset, 'balance.amount', '0.00');

  const fetchBalances = useCallback(async () => {
    const walletBalances = {};

    // Get list of addresses to get balances for
    map(values(wallets), wallet => {
      map(wallet.addresses, account => {
        if (account.address !== accountAddress) {
          walletBalances[account.address] = '0.00';
        }
      });
    });

    try {
      // Check all the ETH balances at once
      const balanceCheckerContract = new ethers.Contract(
        get(networkInfo[network], 'balance_checker_contract_address'),
        balanceCheckerContractAbi,
        web3Provider
      );

      const balances = await balanceCheckerContract.balances(
        keys(walletBalances),
        [ETH_ADDRESS]
      );

      forEach(keys(walletBalances), (address, index) => {
        walletBalances[address] = balances[index];
      });
    } catch (e) {
      logger.log('Error fetching ETH balances in batch', e);
    }

    // We already have the balance data for the selected account
    walletBalances[accountAddress] = handleSignificantDecimals(
      selectedAccountBalance,
      4
    );

    saveWalletBalances(walletBalances);
    return walletBalances;
  }, [accountAddress, network, selectedAccountBalance, wallets]);

  const { data } = useQuery(
    !isEmpty(wallets) && ['walletBalances'],
    fetchBalances
  );

  const resultFromStorage = queryCache.getQueryData(
    WALLET_BALANCES_FROM_STORAGE
  );

  if (!data && !isEmpty(resultFromStorage)) {
    return resultFromStorage;
  }

  if (!data) {
    return {};
  }

  return data;
};

export default useWalletBalances;
