import React, { createContext, useContext, useRef, useCallback, ReactNode, useState, useEffect, useLayoutEffect } from 'react';
import { useAccountSettings } from '.';
import { logger } from '@/logger';

interface ComponentTiming {
  componentName: string;
  startTime: number;
  endTime?: number;
  loadTime?: number;
}

interface WalletPerformanceData {
  componentsTimings: Map<string, ComponentTiming>;
  registeredComponents: Set<string>;
  completedComponents: Set<string>;
  hasGeneratedReport: boolean;
}

interface PerformanceContextType {
  registerComponentStart: (componentName: string, startTime: number) => void;
  registerComponentEnd: (componentName: string, endTime: number) => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const { accountAddress } = useAccountSettings();

  const walletPerformanceRef = useRef<Map<string, WalletPerformanceData>>(new Map());
  const previousWallet = useRef<string | undefined>(accountAddress);
  const [componentCompletionCount, setComponentCompletionCount] = useState(0);

  const getCurrentWalletData = useCallback(() => {
    const walletId = accountAddress || 'unknown';

    if (!walletPerformanceRef.current.has(walletId)) {
      walletPerformanceRef.current.set(walletId, {
        componentsTimings: new Map<string, ComponentTiming>(),
        registeredComponents: new Set<string>(),
        completedComponents: new Set<string>(),
        hasGeneratedReport: false,
      });
    }

    return walletPerformanceRef.current.get(walletId)!;
  }, [accountAddress]);

  const generateReport = useCallback(
    (walletId: string = accountAddress || 'unknown') => {
      const walletData = walletPerformanceRef.current.get(walletId);

      if (!walletData || walletData.registeredComponents.size === 0) {
        return;
      }

      const timings = Array.from(walletData.componentsTimings.values())
        .filter(timing => timing.loadTime !== undefined)
        .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0));

      if (timings.length === 0) {
        logger.debug('[Performance] No completed timings, skipping report');
        return;
      }

      logger.debug('[Performance] Generating summary report');
      const walletInfo = walletId !== 'unknown' ? ` (Wallet: ${walletId})` : '';
      let report = `\n=== WalletPage Performance Breakdown${walletInfo} ===\n`;
      let totalTime = 0;

      timings.forEach(timing => {
        const loadTime = timing.loadTime || 0;
        report += `${timing.componentName}: ${loadTime.toFixed(2)}ms\n`;
        totalTime += loadTime;
      });

      report += `\nTotal component load time: ${totalTime.toFixed(2)}ms\n`;
      report += '=====================================';

      logger.debug(report);

      if (walletData) {
        walletData.hasGeneratedReport = true;
      }
    },
    [accountAddress]
  );

  useLayoutEffect(() => {
    if (previousWallet.current === undefined) {
      previousWallet.current = accountAddress;
      return;
    }

    if (accountAddress !== previousWallet.current) {
      logger.debug(`[Performance] Wallet changed from ${previousWallet.current} to ${accountAddress}`);

      if (previousWallet.current) {
        const oldWalletData = walletPerformanceRef.current.get(previousWallet.current);

        if (oldWalletData && (oldWalletData.hasGeneratedReport || oldWalletData.registeredComponents.size === 0)) {
          walletPerformanceRef.current.delete(previousWallet.current);
          logger.debug(`[Performance] Cleaned up data for wallet: ${previousWallet.current}`);
        } else if (oldWalletData) {
          generateReport(previousWallet.current);
        }
      }

      previousWallet.current = accountAddress;
    }
  }, [accountAddress, generateReport]);

  const registerComponentStart = useCallback(
    (componentName: string, startTime: number) => {
      const walletData = getCurrentWalletData();

      const componentTiming = walletData.componentsTimings.get(componentName) || {
        componentName,
        startTime,
      };

      walletData.componentsTimings.set(componentName, componentTiming);
      walletData.registeredComponents.add(componentName);
    },
    [getCurrentWalletData]
  );

  const registerComponentEnd = useCallback(
    (componentName: string, endTime: number) => {
      const walletData = getCurrentWalletData();
      const componentTiming = walletData.componentsTimings.get(componentName);

      if (componentTiming && !componentTiming.endTime) {
        const loadTime = endTime - componentTiming.startTime;
        const updatedTiming: ComponentTiming = {
          ...componentTiming,
          endTime,
          loadTime,
        };

        walletData.componentsTimings.set(componentName, updatedTiming);
        walletData.completedComponents.add(componentName);

        logger.debug(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);

        setComponentCompletionCount(count => count + 1);
      }
    },
    [getCurrentWalletData]
  );

  useEffect(() => {
    const walletId = accountAddress || 'unknown';
    const walletData = walletPerformanceRef.current.get(walletId);

    if (!walletData || walletData.registeredComponents.size === 0 || walletData.hasGeneratedReport) {
      return;
    }

    const allRegistered = Array.from(walletData.registeredComponents);
    const allCompleted = Array.from(walletData.completedComponents);

    logger.debug(`[Performance] Checking completion: ${allCompleted.length}/${allRegistered.length} components`);

    if (
      allCompleted.length > 0 &&
      allCompleted.length === allRegistered.length &&
      allRegistered.every(comp => walletData.completedComponents.has(comp))
    ) {
      generateReport(walletId);
    }
  }, [accountAddress, generateReport, componentCompletionCount]);

  return (
    <PerformanceContext.Provider
      value={{
        registerComponentStart,
        registerComponentEnd,
      }}
    >
      {children}
    </PerformanceContext.Provider>
  );
}

export function usePerformanceContext() {
  const context = useContext(PerformanceContext);

  if (!context) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }

  return context;
}
