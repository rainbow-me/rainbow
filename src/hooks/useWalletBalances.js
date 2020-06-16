import { ethers } from 'ethers';
import { forEach, get, isEmpty, keys, values } from 'lodash';
import { useCallback } from 'react';
import { queryCache, useQuery } from 'react-query';
import {
  saveWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '../handlers/localstorage/walletBalances';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import { fromWei, handleSignificantDecimals } from '../helpers/utilities';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

const useWalletBalances = wallets => {
  const { network } = useAccountSettings();

  const fetchBalances = useCallback(async () => {
    const walletBalances = {};

    // Get list of addresses to get balances for
    forEach(values(wallets), wallet => {
      forEach(wallet.addresses, account => {
        walletBalances[account.address] = '0.00';
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
        const amountInETH = fromWei(balances[index]);
        const formattedBalance = handleSignificantDecimals(amountInETH, 4);
        walletBalances[address] = formattedBalance;
      });
    } catch (e) {
      logger.log('Error fetching ETH balances in batch', e);
    }

    saveWalletBalances(walletBalances);
    return walletBalances;
  }, [network, wallets]);

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
