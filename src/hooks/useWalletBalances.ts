import { Contract } from '@ethersproject/contracts';
import { forEach, get, isEmpty, keys, values } from 'lodash';
import { useCallback } from 'react';
import { queryCache, useQuery } from 'react-query';
import useAccountSettings from './useAccountSettings';
import {
  saveWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/localstor... Remove this comment to see the full error message
} from '@rainbow-me/handlers/localstorage/walletBalances';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/handlers/web3' or ... Remove this comment to see the full error message
import { web3Provider } from '@rainbow-me/handlers/web3';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/networkInf... Remove this comment to see the full error message
import networkInfo from '@rainbow-me/helpers/networkInfo';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { balanceCheckerContractAbi } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utilities' or its ... Remove this comment to see the full error message
import { fromWei, handleSignificantDecimals } from '@rainbow-me/utilities';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

const useWalletBalances = (wallets: any) => {
  const { network } = useAccountSettings();

  const fetchBalances = useCallback(async () => {
    const walletBalances = {};

    // Get list of addresses to get balances for
    forEach(values(wallets), wallet => {
      forEach(wallet.addresses, account => {
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        walletBalances[account.address] = '0.00';
      });
    });

    try {
      // Check all the ETH balances at once
      const balanceCheckerContract = new Contract(
        get(networkInfo[network], 'balance_checker_contract_address'),
        balanceCheckerContractAbi,
        web3Provider
      );

      const balances = await balanceCheckerContract.balances(
        keys(walletBalances),
        [ETH_ADDRESS]
      );

      forEach(keys(walletBalances), (address, index) => {
        const amountInETH = fromWei(balances[index].toString());
        const formattedBalance = handleSignificantDecimals(amountInETH, 4);
        // @ts-expect-error ts-migrate(7053) FIXME: Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
        walletBalances[address] = formattedBalance;
      });
      saveWalletBalances(walletBalances);
    } catch (e) {
      logger.log('Error fetching ETH balances in batch', e);
    }

    return walletBalances;
  }, [network, wallets]);

  const { data } = useQuery(
    !isEmpty(wallets) && ['walletBalances'],
    fetchBalances
  );

  const resultFromStorage = queryCache.getQueryData(
    WALLET_BALANCES_FROM_STORAGE
  );

  if (isEmpty(data) && !isEmpty(resultFromStorage)) {
    return resultFromStorage;
  }

  if (isEmpty(data)) {
    return {};
  }

  return data;
};

export default useWalletBalances;
