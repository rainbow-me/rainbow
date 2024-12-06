import { useEffect, useState } from 'react';
import { fromWei, greaterThanOrEqualTo } from '@/helpers/utilities';
import BigNumber from 'bignumber.js';
import { SelectedGasFee } from '@/entities';
import { ChainId } from '@/state/backendNetworks/types';

type WalletBalance = {
  amount: string | number;
  display: string;
  isLoaded: boolean;
  symbol: string;
};

type BalanceCheckParams = {
  isMessageRequest: boolean;
  walletBalance: WalletBalance;
  chainId: ChainId;
  selectedGasFee: SelectedGasFee;
  req: any;
};

export const useHasEnoughBalance = ({ isMessageRequest, walletBalance, chainId, selectedGasFee, req }: BalanceCheckParams) => {
  const [isBalanceEnough, setIsBalanceEnough] = useState<boolean>(isMessageRequest);

  useEffect(() => {
    if (isMessageRequest) {
      return;
    }

    const { gasFee } = selectedGasFee;
    if (!walletBalance.isLoaded || !chainId || !gasFee?.estimatedFee) {
      return;
    }

    const txFeeAmount = fromWei(gasFee?.maxFee?.value?.amount ?? 0);
    const balanceAmount = walletBalance.amount;
    const value = req?.value ?? 0;

    const totalAmount = new BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [isMessageRequest, chainId, selectedGasFee, walletBalance, req]);

  return { isBalanceEnough };
};
