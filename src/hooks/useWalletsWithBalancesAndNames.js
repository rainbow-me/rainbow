import { ethers } from 'ethers';
import { get } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [data, setData] = useState(null);
  const { assets } = useAccountAssets();
  const { accountAddress, accountENS, network } = useAccountSettings();
  const selectedAsset = ethereumUtils.getAsset(assets);
  const selectedAccountBalance = get(selectedAsset, 'balance.amount', '0.00');
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchBalancesAndNames = useCallback(
    async updatedWallets => {
      const newWallets = {};
      const addressesThatNeedBalance = [];
      // Fetch ENS names and get list of addresses to get
      await Promise.all(
        Object.keys(wallets).map(async key => {
          newWallets[key] = { ...updatedWallets[key] };
          newWallets[key].addresses = await Promise.all(
            wallets[key].addresses.map(async account => {
              if (account.address === accountAddress) {
                return account;
              }
              addressesThatNeedBalance[account.address] = '0.00';
              const ens = await web3Provider.lookupAddress(account.address);
              if (ens && ens !== account.address) {
                account.ens = ens;
              }
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
          Object.keys(addressesThatNeedBalance),
          [ETH_ADDRESS]
        );

        Object.keys(addressesThatNeedBalance).forEach((address, index) => {
          addressesThatNeedBalance[address] = values[index];
        });
      } catch (e) {
        logger.log('Error fetching ETH balances in batch', e);
      }

      // Update the balance for each wallet
      Object.keys(wallets).map(async key => {
        newWallets[key].addresses.forEach(account => {
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
      isMountedRef && setData(newWallets);
    },
    [accountAddress, network, wallets]
  );

  useEffect(() => {
    if (!wallets) return {};

    // We already have the data for the selected account
    const updatedWallets = { ...wallets };
    Object.keys(updatedWallets).forEach(key => {
      updatedWallets[key].addresses = updatedWallets[key].addresses.map(
        account => {
          if (account.address === accountAddress) {
            account.ens = accountENS;
            account.balance = handleSignificantDecimals(
              selectedAccountBalance,
              4
            );
          }
          return account;
        }
      );
    });
    isMountedRef && fetchBalancesAndNames(updatedWallets);
  }, [
    accountAddress,
    accountENS,
    fetchBalancesAndNames,
    network,
    selectedAccountBalance,
    wallets,
  ]);

  return data;
};
