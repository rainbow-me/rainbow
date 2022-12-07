import * as React from 'react';
import { Bleed, Box, Separator } from '@/design-system';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';
import { getFormattedEthFee } from '@/screens/transaction-details/helpers/getFormattedEthFee';

type Props = {
  accountAddress: string;
  txHash?: string;
  fromCurrentAddress?: boolean;
  weiFee?: number;
};

const Divider = () => (
  <Bleed horizontal="20px">
    <Separator color="separatorTertiary" />
  </Bleed>
);

export const TransactionDetailsContent: React.FC<Props> = ({
  accountAddress,
  txHash,
  fromCurrentAddress,
  weiFee,
}) => {
  const formattedHash = txHash ? shortenTxHashString(txHash) : '';
  const formattedEthFee = getFormattedEthFee(weiFee ?? 0);

  return (
    <Box
      background="surfacePrimary"
      flexGrow={1}
      paddingHorizontal="20px"
      paddingBottom="20px"
    >
      {fromCurrentAddress && weiFee && (
        <DoubleLineTransactionDetailsRow
          leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
          title={'Network Fee'}
          value={formattedEthFee}
        />
      )}

      <Divider />
      {formattedHash && (
        <SingleLineTransactionDetailsRow
          icon={'􀆃'}
          title={'Tx Hash'}
          value={formattedHash}
        />
      )}
    </Box>
  );
};
