import { useMemo } from 'react';

import { format } from 'date-fns';

import { time } from '@/framework/core/utils/time';
import timeUnits from '@/references/time-units.json';

import { useEnsSearchStore } from '../data/stores/searchStore';
import { ENS_DOMAIN, formatRentPrice } from '../utils/helpers';
import useENSLocalTransactions from './useENSLocalTransactions';

export function useENSSearch({
  yearsDuration = 1,
  name: inputName,
  renew = false,
}: {
  yearsDuration?: number;
  name: string;
  renew?: boolean;
}) {
  const name = inputName.replace(ENS_DOMAIN, '');
  const duration = yearsDuration * timeUnits.secs.year;
  const input = name.length > 2 ? { name, duration, renew } : undefined;

  const { commitTransactionHash, confirmedRegistrationTransaction, pendingRegistrationTransaction } = useENSLocalTransactions({
    name: name + ENS_DOMAIN,
  });
  const result = useEnsSearchStore(s => s.get(input));
  const settled = useEnsSearchStore(s => s.hasSettled(input));

  const pending = !!(commitTransactionHash || pendingRegistrationTransaction) && !confirmedRegistrationTransaction;

  const data = useMemo(() => {
    if (!result?.valid) return undefined;
    return {
      ...result,
      rentPrice: formatRentPrice(result.rentPrice, yearsDuration),
      expirationDate: result.expirationDate ? format(time.seconds(Number(result.expirationDate)), 'MMM d, y') : undefined,
    };
  }, [result, yearsDuration]);

  return {
    data,
    hint: result?.valid === false ? result.hint : undefined,
    isAvailable: result?.valid && result.available === true && !pending && !confirmedRegistrationTransaction,
    isRegistered: (result?.valid && result.available === false) || !!confirmedRegistrationTransaction,
    isPending: result?.valid && result.available === true && pending,
    isInvalid: result?.valid === false,
    isIdle: !input,
    isLoading: !!input && !settled,
  };
}
