import { useConsolidatedTransactions } from '@/resources/transactions/consolidatedTransactions';
import useAccountSettings from './useAccountSettings';
import useUserAccounts from './useUserAccounts';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Network } from '@/helpers';
import { Address } from 'viem';
import * as i18n from '@/languages';

type UseSendTransactionMessageProps = {
  isL2: boolean;
  toAddress: Address;
  network: Network;
};

const MAX_BATCHES_TO_CHECK = 10;

export const useSendTransactionMessage = ({ isL2, toAddress, network }: UseSendTransactionMessageProps) => {
  const { accountAddress, nativeCurrency } = useAccountSettings();
  const { userAccounts } = useUserAccounts();

  const sends = useRef<number>(0);
  const sendsCurrentNetwork = useRef<number>(0);

  const shouldShowChecks = useRef<boolean>(false);

  const [message, setMessage] = useState<string>();

  const { data, fetchNextPage, hasNextPage } = useConsolidatedTransactions({
    address: accountAddress,
    currency: nativeCurrency,
  });

  const transactions = useMemo(() => {
    return data?.pages.flatMap(page => page.transactions) || [];
  }, [data]);

  const isSendingToUserAccount = useMemo(() => {
    const found = userAccounts?.find(account => {
      return account.address.toLowerCase() === toAddress?.toLowerCase();
    });
    return !!found;
  }, [toAddress, userAccounts]);

  useEffect(() => {
    const checkTransactions = async () => {
      if (isSendingToUserAccount) {
        setMessage(i18n.t(i18n.l.wallet.transaction.you_own_this_wallet));
        return;
      }

      const checkBatch = (txs: typeof transactions) => {
        for (const tx of txs) {
          if (tx.to?.toLowerCase() === toAddress?.toLowerCase() && tx.from?.toLowerCase() === accountAddress?.toLowerCase()) {
            sends.current += 1;
            if (tx.network === network) {
              sendsCurrentNetwork.current += 1;
              shouldShowChecks.current = isL2 && sendsCurrentNetwork.current < 3;
            }
          }
        }
      };

      checkBatch(transactions);

      const fetchAndCheckBatches = async () => {
        const batchPromises = [];
        for (let i = 0; i < MAX_BATCHES_TO_CHECK && hasNextPage; i++) {
          batchPromises.push(fetchNextPage().then(result => result.data?.pages.slice(-1)[0].transactions || []));
        }

        const batchResults = await Promise.all(batchPromises);
        batchResults.forEach(checkBatch);
      };

      await fetchAndCheckBatches();

      if (sends.current > 0) {
        setMessage(
          i18n.t(i18n.l.wallet.transaction.previous_sends, {
            number: sends.current,
          })
        );
      } else {
        setMessage(i18n.t(i18n.l.wallet.transaction.first_time_send));
      }
    };

    checkTransactions();
  }, [accountAddress, isSendingToUserAccount, network, toAddress, transactions, hasNextPage, fetchNextPage, data]);

  return {
    message,
    shouldShowChecks: shouldShowChecks.current,
  };
};
