import { useEffect, useRef, useLayoutEffect } from 'react';
import { usePerformanceContext } from './usePerformanceContext';
import useAccountSettings from './useAccountSettings';

export function useComponentLoadTime(componentName: string) {
  const { accountAddress } = useAccountSettings();
  const { registerComponentStart, registerComponentEnd } = usePerformanceContext();
  const startTimeRef = useRef<number>(0);
  const hasEndedRef = useRef<boolean>(false);
  const walletIdRef = useRef<string | undefined>(accountAddress);

  useLayoutEffect(() => {
    startTimeRef.current = performance.now();
    hasEndedRef.current = false;
    walletIdRef.current = accountAddress;

    registerComponentStart(componentName, startTimeRef.current);
  }, [componentName, registerComponentStart, accountAddress]);

  useEffect(() => {
    if (hasEndedRef.current && walletIdRef.current === accountAddress) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!hasEndedRef.current || walletIdRef.current !== accountAddress) {
        const endTime = performance.now();
        registerComponentEnd(componentName, endTime);
        hasEndedRef.current = true;
        walletIdRef.current = accountAddress;
      }
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      if (!hasEndedRef.current || walletIdRef.current !== accountAddress) {
        const endTime = performance.now();
        registerComponentEnd(componentName, endTime);
        hasEndedRef.current = true;
        walletIdRef.current = accountAddress;
      }
    };
  }, [componentName, registerComponentEnd, accountAddress]);
}
