import * as React from 'react';
import { Bleed, Box, Separator } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/SingleLineTransactionDetailsRow';
import { shortenTxHashString } from '@/screens/transaction-details/shortenTxHashString';
import { ethereumUtils } from '@/utils';

type Props = {
  transaction: RainbowTransaction;
};

const Divider = () => (
  <Bleed horizontal="20px">
    <Separator color="separatorTertiary" />
  </Bleed>
);

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
      <Divider />
      <SingleLineTransactionDetailsRow
        icon={'􀆃'}
        title={'Tx Hash'}
        value={formattedHash}
      />
    </Box>
  );
};
