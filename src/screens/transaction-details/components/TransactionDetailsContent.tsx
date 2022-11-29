import * as React from 'react';
import { Bleed, Box, Separator } from '@/design-system';
import { RainbowTransaction } from '@/entities';
import { SingleLineTransactionDetailsRow } from '@/screens/transaction-details/components/SingleLineTransactionDetailsRow';
import { shortenTxHashString } from '@/screens/transaction-details/helpers/shortenTxHashString';
import { ethereumUtils } from '@/utils';
import { DoubleLineTransactionDetailsRow } from '@/screens/transaction-details/components/DoubleLineTransactionDetailsRow';
import { TransactionDetailsSymbol } from '@/screens/transaction-details/components/TransactionDetailsSymbol';

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
      <DoubleLineTransactionDetailsRow
        leftComponent={<TransactionDetailsSymbol icon="􀵟" withBackground />}
        secondaryValue={'$2.59'}
        title={'Network Fee'}
        value={'43.71 Gwei'}
      />
      <Divider />
      <SingleLineTransactionDetailsRow
        icon={'􀆃'}
        title={'Tx Hash'}
        value={formattedHash}
      />
    </Box>
  );
};
