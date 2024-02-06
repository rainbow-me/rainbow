import { useCallback, useRef, useState } from 'react';

export const useTransactionDetailsToasts = () => {
  const [presentedToast, setPresentedToast] = useState<'address' | 'hash' | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout>();

  const presentToastFor = useCallback((type: 'address' | 'hash') => {
    setPresentedToast(type);
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }
    toastTimeout.current = setTimeout(() => setPresentedToast(null), 2000);
  }, []);

  return {
    presentToastFor,
    presentedToast,
  };
};
