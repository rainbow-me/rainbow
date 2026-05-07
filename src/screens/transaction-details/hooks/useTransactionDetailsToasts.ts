import { useCallback, useRef, useState } from 'react';

type ToastType = 'address' | 'hash' | 'link';

export const useTransactionDetailsToasts = () => {
  const [presentedToast, setPresentedToast] = useState<ToastType | null>(null);
  const toastTimeout = useRef<NodeJS.Timeout>(undefined);

  const presentToastFor = useCallback((type: ToastType) => {
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
