import * as React from 'react';
import { Box } from '@/design-system';
import { RainbowTransactionFee } from '@/entities/transactions/transaction';
import { TransactionDetailsValueAndFeeSection } from '@/screens/transaction-details/components/TransactionDetailsValueAndFeeSection';
import { TransactionDetailsHashAndActionsSection } from '@/screens/transaction-details/components/TransactionDetailsHashAndActionsSection';

type Props = {
  txHash?: string;
  fee?: RainbowTransactionFee;
  value?: string;
  coinSymbol?: string;
  coinAddress?: string;
};

export const TransactionDetailsContent: React.FC<Props> = ({ txHash, fee }) => {
  return (
    <Box
      background="surfacePrimary"
      flexGrow={1}
      paddingHorizontal="20px"
      paddingBottom="20px"
    >
      <TransactionDetailsValueAndFeeSection fee={fee} />
      <TransactionDetailsHashAndActionsSection hash={txHash} />
    </Box>
  );
};
