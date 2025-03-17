import { useEffect, useRef, useLayoutEffect } from 'react';
import { usePerformanceContext } from './usePerformanceContext';
import useAccountSettings from './useAccountSettings';

export function useComponentLoadTime(componentName: string) {
  const { accountAddress } = useAccountSettings();
  const { registerComponentStart, registerComponentEnd } = usePerformanceContext();
  const startTimeRef = useRef<number>(0);
  const hasEndedRef = useRef<boolean>(false);
  const walletIdRef = useRef<string | undefined>(accountAddress);

  // Use useLayoutEffect to capture the start time as early as possible
  useLayoutEffect(() => {
    // Reset the tracking when the component mounts or wallet changes
    startTimeRef.current = performance.now();
    hasEndedRef.current = false;
    walletIdRef.current = accountAddress;

    // Register the start time
    registerComponentStart(componentName, startTimeRef.current);
  }, [componentName, registerComponentStart, accountAddress]);

  // Use useEffect to register the end time after the component has rendered
  useEffect(() => {
    // Skip if we've already registered the end time for the current wallet
    if (hasEndedRef.current && walletIdRef.current === accountAddress) {
      return;
    }

    // Small delay to ensure the component has fully rendered
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
      // If the component unmounts before we register the end time, register it now
      if (!hasEndedRef.current || walletIdRef.current !== accountAddress) {
        const endTime = performance.now();
        registerComponentEnd(componentName, endTime);
        hasEndedRef.current = true;
        walletIdRef.current = accountAddress;
      }
    };
  }, [componentName, registerComponentEnd, accountAddress]);
}
