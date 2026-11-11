import { useMemo } from 'react';

import { format } from 'date-fns';

import { ChainId } from '@/features/network/types/backendNetworks';
import { time } from '@/framework/core/utils/time';
import timeUnits from '@/references/time-units.json';
import { userAssetsStoreManager } from '@/state/assets/userAssetsStoreManager';
import ethereumUtils from '@/utils/ethereumUtils';

import { useEnsSearchStore } from '../data/stores/searchStore';
import { ENS_DOMAIN, formatRentPrice } from '../utils/helpers';
import useENSLocalTransactions from './useENSLocalTransactions';

export default function useENSSearch({ yearsDuration = 1, name: inputName }: { yearsDuration?: number; name: string }) {
  const name = inputName.replace(ENS_DOMAIN, '');
  const duration = yearsDuration * timeUnits.secs.year;
  const input = name.length > 2 ? { name, duration } : undefined;

  const nativeCurrency = userAssetsStoreManager(s => s.currency);
  const { commitTransactionHash, confirmedRegistrationTransaction, pendingRegistrationTransaction } = useENSLocalTransactions({
    name: name + ENS_DOMAIN,
  });
  const result = useEnsSearchStore(s => s.get(input));
  const settled = useEnsSearchStore(s => s.hasSettled(input));

  const pending = !!(commitTransactionHash || pendingRegistrationTransaction) && !confirmedRegistrationTransaction;

  const data = useMemo(() => {
    if (!result?.valid) return result;
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork({ chainId: ChainId.mainnet });
    return {
      ...result,
      rentPrice: formatRentPrice(result.rentPrice, yearsDuration, nativeCurrency, nativeAssetPrice),
      registrationDate: result.registrationDate ? format(time.seconds(Number(result.registrationDate)), 'MMMM d, y') : undefined,
      expirationDate: result.expirationDate ? format(time.seconds(Number(result.expirationDate)), 'MMM d, y') : undefined,
    };
  }, [result, yearsDuration, nativeCurrency]);

  return {
    data,
    isAvailable: result?.available === true && !pending && !confirmedRegistrationTransaction,
    isRegistered: result?.available === false || !!confirmedRegistrationTransaction,
    isPending: result?.available === true && pending,
    isInvalid: result?.valid === false,
    isIdle: !input,
    isLoading: !!input && !settled,
  };
}
