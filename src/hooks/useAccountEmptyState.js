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
      console.log('💰💰 Checked storage. Is empty?', reallyEmpty);
      if (reallyEmpty) {
        setIsReallyEmpty(true);
      } else {
        console.log('💰💰 Falling back', isEmpty);
        setIsReallyEmpty(isEmpty);
      }
    };

    checkStorage();
  }, [accountAddress, isEmpty, network]);

  return {
    isEmpty: isReallyEmpty,
  };
}
