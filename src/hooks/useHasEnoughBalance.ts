import { useEffect, useState } from 'react';
import { fromWei, greaterThanOrEqualTo } from '@/helpers/utilities';
import BigNumber from 'bignumber.js';
import { SelectedGasFee } from '@/entities';
import { ChainId } from '@/__swaps__/types/chains';

type WalletBalance = {
  amount: string | number;
  display: string;
  isLoaded: boolean;
  symbol: string;
};

type BalanceCheckParams = {
  isMessageRequest: boolean;
  walletBalance: WalletBalance;
  currentChainId: ChainId;
  selectedGasFee: SelectedGasFee;
  req: any;
};

export const useBalanceCheck = ({ isMessageRequest, walletBalance, currentChainId, selectedGasFee, req }: BalanceCheckParams) => {
  const [isBalanceEnough, setIsBalanceEnough] = useState<boolean>();

  useEffect(() => {
    if (isMessageRequest) {
      setIsBalanceEnough(true);
      return;
    }

    const { gasFee } = selectedGasFee;
    if (!walletBalance.isLoaded || !currentChainId || !gasFee?.estimatedFee) {
      return;
    }

    const txFeeAmount = fromWei(gasFee?.maxFee?.value?.amount ?? 0);
    const balanceAmount = walletBalance.amount;
    const value = req?.value ?? 0;

    const totalAmount = new BigNumber(fromWei(value)).plus(txFeeAmount);
    const isEnough = greaterThanOrEqualTo(balanceAmount, totalAmount);

    setIsBalanceEnough(isEnough);
  }, [isMessageRequest, currentChainId, selectedGasFee, walletBalance, req]);

  return { isBalanceEnough };
};
