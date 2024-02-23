import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccountSettings, useENSLocalTransactions } from '.';
import { fetchRegistrationDate } from '@/handlers/ens';
import { ENS_DOMAIN, formatRentPrice, getAvailable, getENSRegistrarControllerContract, getNameExpires, getRentPrice } from '@/helpers/ens';
import { Network } from '@/helpers/networkTypes';
import { timeUnits } from '@/references';
import { ethereumUtils, validateENS } from '@/utils';

const formatTime = (timestamp: string, abbreviated: boolean = true) => {
  const style = abbreviated ? 'MMM d, y' : 'MMMM d, y';
  return format(new Date(Number(timestamp) * 1000), style);
};

export default function useENSSearch({ yearsDuration = 1, name: inputName }: { yearsDuration?: number; name: string }) {
  const [contract, setContract]: any = useState(null);

  useEffect(() => {
    const getContract = async () => {
      const theContract = await getENSRegistrarControllerContract();
      setContract(theContract);
    };
    if (!contract) {
      getContract();
    }
  }, [contract, setContract]);

  const name = inputName.replace(ENS_DOMAIN, '');
  const { nativeCurrency } = useAccountSettings();

  const { commitTransactionHash, confirmedRegistrationTransaction, pendingRegistrationTransaction } = useENSLocalTransactions({
    name: `${name}${ENS_DOMAIN}`,
  });

  const isValidLength = useMemo(() => name.length > 2, [name.length]);

  const duration = yearsDuration * timeUnits.secs.year;

  const getRegistrationValues = useCallback(async () => {
    const ensValidation = validateENS(`${name}${ENS_DOMAIN}`, {
      includeSubdomains: false,
    });

    if (!ensValidation.valid) {
      return {
        code: ensValidation.code,
        hint: ensValidation.hint,
        valid: false,
      };
    }

    const [isAvailable, rentPrice] = await Promise.all([getAvailable(name, contract), getRentPrice(name, duration, contract)]);
    const nativeAssetPrice = ethereumUtils.getPriceOfNativeAssetForNetwork(Network.mainnet);
    const formattedRentPrice = formatRentPrice(rentPrice, yearsDuration, nativeCurrency, nativeAssetPrice);

    if (isAvailable) {
      if (confirmedRegistrationTransaction) {
        return {
          available: false,
          pending: false,
          valid: true,
        };
      }

      if (pendingRegistrationTransaction) {
        return {
          available: false,
          pending: true,
          rentPrice: formattedRentPrice,
          valid: true,
        };
      }

      if (commitTransactionHash) {
        return {
          pending: true,
          rentPrice: formattedRentPrice,
          valid: true,
        };
      }

      return {
        available: true,
        rentPrice: formattedRentPrice,
        valid: true,
      };
    } else {
      const [registrationDate, nameExpires] = await Promise.all([fetchRegistrationDate(name + ENS_DOMAIN), getNameExpires(name)]);

      const formattedRegistrarionDate = formatTime(registrationDate, false);
      const formattedExpirationDate = formatTime(nameExpires);

      return {
        available: false,
        expirationDate: formattedExpirationDate,
        registrationDate: formattedRegistrarionDate,
        rentPrice: formattedRentPrice,
        valid: true,
      };
    }
  }, [
    name,
    pendingRegistrationTransaction,
    commitTransactionHash,
    confirmedRegistrationTransaction,
    contract,
    duration,
    yearsDuration,
    nativeCurrency,
  ]);

  const { data, status, isLoading, fetchStatus } = useQuery(
    [
      'getRegistrationValues',
      [
        duration,
        name,
        nativeCurrency,
        yearsDuration,
        commitTransactionHash,
        pendingRegistrationTransaction,
        confirmedRegistrationTransaction,
      ],
    ],
    getRegistrationValues,
    {
      enabled: isValidLength && Boolean(contract),
      retry: 0,
      staleTime: Infinity,
    }
  );

  const isAvailable = status === 'success' && data?.available === true;
  const isRegistered = status === 'success' && data?.available === false;
  const isPending = status === 'success' && data?.pending === true;
  const isInvalid = status === 'success' && !data?.valid;
  const isIdle = isLoading && fetchStatus === 'idle';

  return {
    data,
    isAvailable,
    isIdle,
    isInvalid,
    isLoading,
    isPending,
    isRegistered,
  };
}
