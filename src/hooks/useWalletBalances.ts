import { Contract } from '@ethersproject/contracts';
import { useQuery } from '@tanstack/react-query';
import { isEmpty, keys } from 'lodash';
import { useCallback } from 'react';
import {
  saveWalletBalances,
  WALLET_BALANCES_FROM_STORAGE,
} from '@/handlers/localstorage/walletBalances';
import { web3Provider } from '@/handlers/web3';
import networkInfo from '@/helpers/networkInfo';
import { AllRainbowWallets } from '@/model/wallet';
import { queryClient } from '@/react-query';
import { balanceCheckerContractAbi } from '@/references';
import { fromWei, handleSignificantDecimals } from '@/helpers/utilities';
import logger from '@/utils/logger';
import { useSelector } from 'react-redux';
import { AppState } from '@/redux/store';

const ETH_ADDRESS = '0x0000000000000000000000000000000000000000';

const useWalletBalances = (wallets: AllRainbowWallets) => {
  const network = useSelector((state: AppState) => state.settings.network);

  const fetchBalances = useCallback(async () => {
    const walletBalances: { [address: string]: string } = {};

    // Get list of addresses to get balances for
    Object.values(wallets).forEach((wallet: any) => {
      wallet.addresses.forEach((account: any) => {
        walletBalances[account.address] = '0.00';
      });
    });

    try {
      // Check all the ETH balances at once
      const balanceCheckerContract = new Contract(
        networkInfo[network]?.balance_checker_contract_address,
        balanceCheckerContractAbi,
        web3Provider
      );

      const balances = await balanceCheckerContract.balances(
        keys(walletBalances),
        [ETH_ADDRESS]
      );

      Object.keys(walletBalances).forEach((address, index) => {
        const amountInETH = fromWei(balances[index].toString());
        const formattedBalance = handleSignificantDecimals(amountInETH, 4);
        walletBalances[address] = formattedBalance;
      });
      saveWalletBalances(walletBalances);
    } catch (e) {
      logger.log('Error fetching ETH balances in batch', e);
    }

    return walletBalances;
  }, [network, wallets]);

  const { data } = useQuery(['walletBalances'], fetchBalances, {
    enabled: !isEmpty(wallets),
  });

  const resultFromStorage = queryClient.getQueryData<{
    [address: string]: string;
  }>([WALLET_BALANCES_FROM_STORAGE]);

  if (isEmpty(data) && !isEmpty(resultFromStorage)) {
    return resultFromStorage;
  }

  if (isEmpty(data)) {
    return {};
  }

  return data;
};

export default useWalletBalances;
