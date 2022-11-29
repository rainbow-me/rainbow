import * as React from 'react';
import { Box } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/SingleLineTransactionDetailsRow';
import { shortenTxHashString } from '@/screens/transaction-details/shortenTxHashString';
import { ethereumUtils } from '@/utils';

type Props = {
  transaction: RainbowTransaction;
};

export const TransactionDetailsContent: React.FC<Props> = ({ transaction }) => {
  const hash = ethereumUtils.getHash(transaction);
  const formattedHash = hash ? shortenTxHashString(hash) : '';

  return (
    <Box
      background="surfacePrimary"
      flexGrow={1}
      paddingHorizontal="20px"
      paddingBottom="20px"
    >
      <SingleLineTransactionDetailsRow
        icon={'􀆃'}
        title={'Tx Hash'}
        value={formattedHash}
      />
    </Box>
  );
};
