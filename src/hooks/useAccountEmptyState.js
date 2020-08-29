import { useEffect, useState } from 'react';
import { getAccountEmptyState } from '../handlers/localstorage/accountLocal';
import useAccountSettings from './useAccountSettings';
import useWalletSectionsData from './useWalletSectionsData';

export default function useAccountEmptyState() {
  const { network, accountAddress } = useAccountSettings();
  const { isEmpty } = useWalletSectionsData();
  const [isReallyEmpty, setIsReallyEmpty] = useState(true);

  useEffect(() => {
    const checkStorage = async () => {
      const reallyEmpty = await getAccountEmptyState(accountAddress, network);
      if (reallyEmpty) {
        setIsReallyEmpty(true);
      } else {
        setIsReallyEmpty(isEmpty);
      }
    };

    checkStorage();
  }, [accountAddress, isEmpty, network]);

  return {
    isEmpty: isReallyEmpty,
  };
}
