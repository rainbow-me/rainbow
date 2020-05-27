import { ethers } from 'ethers';
import { forEach, get, isEmpty, keys, map } from 'lodash';
import { useCallback, useMemo } from 'react';
import { queryCache, useQuery } from 'react-query';
import {
  saveWalletBalanceNames,
  WALLET_BALANCE_NAMES_FROM_STORAGE,
} from '../handlers/localstorage/walletBalanceNames';
import { web3Provider } from '../handlers/web3';
import networkInfo from '../helpers/networkInfo';
import {
  convertRawAmountToDecimalFormat,
  handleSignificantDecimals,
} from '../helpers/utilities';
import balanceCheckerContractAbi from '../references/balances-checker-abi.json';
import { ethereumUtils, logger } from '../utils';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

export const useWalletsWithBalancesAndNames = wallets => {
  const { assets } = useAccountAssets();
  const { accountAddress, accountENS, network } = useAccountSettings();
  const selectedAsset = ethereumUtils.getAsset(assets);
  const selectedAccountBalance = get(selectedAsset, 'balance.amount', '0.00');

  const fetchBalancesAndNames = useCallback(
    async (_, updatedWallets) => {
      const newWallets = {};
      const addressesThatNeedBalance = {};

      // Fetch ENS names and get list of addresses to get
      await Promise.all(
        map(keys(wallets), async key => {
          newWallets[key] = { ...updatedWallets[key] };
          newWallets[key].addresses = await Promise.all(
            map(wallets[key].addresses, async account => {
              if (account.address === accountAddress) {
                return account;
              }
              addressesThatNeedBalance[account.address] = '0.00';
              try {
                const ens = await web3Provider.lookupAddress(account.address);
                if (ens && ens !== account.address) {
                  account.ens = ens;
                }
                // eslint-disable-next-line no-empty
              } catch (error) {}
              return account;
            })
          );
        })
      );

      try {
        // Check all the ETH balances at once
        const balanceCheckerContract = new ethers.Contract(
          get(networkInfo[network], 'balance_checker_contract_address'),
          balanceCheckerContractAbi,
          web3Provider
        );

        const values = await balanceCheckerContract.balances(
          keys(addressesThatNeedBalance),
          [ETH_ADDRESS]
        );

        forEach(keys(addressesThatNeedBalance), (address, index) => {
          addressesThatNeedBalance[address] = values[index];
        });
      } catch (e) {
        logger.log('Error fetching ETH balances in batch', e);
      }

      // Update the balance for each wallet
      map(keys(wallets), async key => {
        forEach(newWallets[key].addresses, account => {
          if (account.address !== accountAddress) {
            const balance = addressesThatNeedBalance[account.address];
            const decimalFormatAmount = convertRawAmountToDecimalFormat(
              balance,
              18
            );
            account.balance = handleSignificantDecimals(decimalFormatAmount, 4);
          }
        });
      });

      saveWalletBalanceNames(newWallets);
      return newWallets;
    },
    [accountAddress, network, wallets]
  );

  const updatedWallets = useMemo(() => {
    const updated = { ...wallets };

    // We already have the data for the selected account
    Object.keys(updated).forEach(key => {
      updated[key].addresses = updated[key].addresses.map(account => {
        if (account.address === accountAddress) {
          account.ens = accountENS;
          account.balance = handleSignificantDecimals(
            selectedAccountBalance,
            4
          );
        }
        return account;
      });
    });

    return updated;
  }, [accountAddress, accountENS, selectedAccountBalance, wallets]);

  const { data } = useQuery(
    !isEmpty(updatedWallets) && ['walletBalanceNames'],
    [updatedWallets],
    fetchBalancesAndNames
  );

  const resultFromStorage = queryCache.getQueryData(
    WALLET_BALANCE_NAMES_FROM_STORAGE
  );

  if (!data && !isEmpty(resultFromStorage)) {
    return resultFromStorage;
  }

  if (!data) {
    return {};
  }

  return data;
};
