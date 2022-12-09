import * as React from 'react';
import { Box } from '@/design-system';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';

type Props = {
  coinAddress?: string;
  coinSymbol?: string;
  fee?: RainbowTransactionFee;
  nativeCurrencyValue?: string;
  txHash?: string;
  value?: string;
};

export const TransactionDetailsContent: React.FC<Props> = ({
  coinAddress,
  coinSymbol,
  fee,
  nativeCurrencyValue,
  txHash,
  value,
}) => {
  return (
    <Box
      background="surfacePrimary"
      flexGrow={1}
      paddingHorizontal="20px"
      paddingBottom="20px"
    >
      <TransactionDetailsValueAndFeeSection
        coinAddress={coinAddress}
        coinSymbol={coinSymbol}
        fee={fee}
        nativeCurrencyValue={nativeCurrencyValue}
        value={value}
      />
      <TransactionDetailsHashAndActionsSection hash={txHash} />
    </Box>
  );
};
