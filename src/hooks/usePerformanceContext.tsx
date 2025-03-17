import React, { createContext, useContext, useRef, useCallback, ReactNode, useState, useEffect, useLayoutEffect } from 'react';
import { useAccountSettings } from '.';
import { logger } from '@/logger';

interface ComponentTiming {
  componentName: string;
  startTime: number;
  endTime?: number;
  loadTime?: number;
}

// Structure to store wallet-specific performance data
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

  // Store performance data by wallet
  const walletPerformanceRef = useRef<Map<string, WalletPerformanceData>>(new Map());
  const previousWallet = useRef<string | undefined>(accountAddress);
  // State to trigger effect when component registration changes
  const [componentCompletionCount, setComponentCompletionCount] = useState(0);

  // Helper to get or initialize current wallet's performance data
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

  // Generate performance report for a specific wallet
  const generateReport = useCallback(
    (walletId: string = accountAddress || 'unknown') => {
      const walletData = walletPerformanceRef.current.get(walletId);

      // Skip if no data for this wallet or no registered components
      if (!walletData || walletData.registeredComponents.size === 0) {
        return;
      }

      // All components have loaded, generate final report
      const timings = Array.from(walletData.componentsTimings.values())
        .filter(timing => timing.loadTime !== undefined)
        .sort((a, b) => (b.loadTime || 0) - (a.loadTime || 0));

      // Skip if no timing data with load times
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

      // Mark that we've generated a report for this wallet
      if (walletData) {
        walletData.hasGeneratedReport = true;
      }
    },
    [accountAddress]
  );

  // Handle wallet changes
  useLayoutEffect(() => {
    if (previousWallet.current === undefined) {
      previousWallet.current = accountAddress;
      return;
    }

    // If wallet changed
    if (accountAddress !== previousWallet.current) {
      logger.debug(`[Performance] Wallet changed from ${previousWallet.current} to ${accountAddress}`);

      // Clean up the old wallet data if we're done with it
      if (previousWallet.current) {
        const oldWalletData = walletPerformanceRef.current.get(previousWallet.current);

        // Only delete if we've generated a report or if there's no significant data
        if (oldWalletData && (oldWalletData.hasGeneratedReport || oldWalletData.registeredComponents.size === 0)) {
          walletPerformanceRef.current.delete(previousWallet.current);
          logger.debug(`[Performance] Cleaned up data for wallet: ${previousWallet.current}`);
        } else if (oldWalletData) {
          // Force a report for the old wallet if we have data but no report yet
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

      // Register this component as being tracked
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

        // Update completion count to trigger the effect that checks for report generation
        setComponentCompletionCount(count => count + 1);
      }
    },
    [getCurrentWalletData]
  );

  // Generate report when all registered components have completed
  useEffect(() => {
    const walletId = accountAddress || 'unknown';
    const walletData = walletPerformanceRef.current.get(walletId);

    // Skip if no data for this wallet, no registered components, or if we've already generated a report
    if (!walletData || walletData.registeredComponents.size === 0 || walletData.hasGeneratedReport) {
      return;
    }

    // Check if all registered components have completed
    const allRegistered = Array.from(walletData.registeredComponents);
    const allCompleted = Array.from(walletData.completedComponents);

    logger.debug(`[Performance] Checking completion: ${allCompleted.length}/${allRegistered.length} components`);

    // Only proceed if we have at least one completed component and all components are complete
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
