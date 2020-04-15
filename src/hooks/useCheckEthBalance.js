import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { hasEthBalance } from '../handlers/web3';
import { setIsWalletEthZero } from '../redux/isWalletEthZero';
import { logger } from '../utils';
import useAccountSettings from './useAccountSettings';

export default function useCheckEthBalance() {
  const dispatch = useDispatch();
  const { accountAddress } = useAccountSettings();

  return useCallback(async () => {
    try {
      if (accountAddress) {
        const ethBalance = await hasEthBalance(accountAddress);
        const isZero = !ethBalance;
        dispatch(setIsWalletEthZero(isZero));
      }
    } catch (error) {
      logger.log('Error: Checking eth balance', error);
    }
  }, [dispatch, accountAddress]);
}
