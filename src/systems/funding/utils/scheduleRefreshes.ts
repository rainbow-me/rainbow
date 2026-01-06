import { logger } from '@/logger';

// ============ Types ========================================================== //

export type RefreshConfig = {
  delays: number[];
  handler: () => Promise<void>;
};

type ScheduleRefreshesParams = {
  /**
   * Callback executed once the source chain confirms.
   * For relayer-based flows, this might be immediately after submit.
   * For user-signed flows, wait for provider confirmation first.
   */
  onSourceConfirmed: () => void;
  /** Refresh configuration with delays and handler */
  refresh: RefreshConfig;
  /** Logging prefix for error messages */
  tag: string;
};

// ============ Core Refresh Execution ========================================= //

function dispatchRefreshes(refresh: RefreshConfig, tag: string): void {
  for (const delay of refresh.delays) {
    const execute = () => {
      refresh.handler().catch(error => {
        logger.warn(`[${tag}]: refresh failed`, { delay, error });
      });
    };

    if (delay === 0) {
      execute();
    } else {
      setTimeout(execute, delay);
    }
  }
}

// ============ Refresh Scheduling ============================================= //

/**
 * Schedules refresh handler calls at configured delays.
 *
 * This utility standardizes the post-confirmation refresh pattern used by both
 * deposit and withdrawal flows. Immediate refreshes (delay = 0) run synchronously,
 * while delayed refreshes use setTimeout.
 *
 * @example
 * ```ts
 * // For relayer-based withdrawal (confirmation is synchronous)
 * response.wait().then(result => {
 *   if (isSuccessful(result)) {
 *     scheduleRefreshes({
 *       onSourceConfirmed: () => {},
 *       refresh: config.refresh,
 *       tag: 'withdrawal',
 *     });
 *   }
 * });
 *
 * // For user-signed deposit (wait for provider confirmation)
 * scheduleRefreshes({
 *   onSourceConfirmed: () => provider.waitForTransaction(hash),
 *   refresh: config.refresh,
 *   tag: 'deposit',
 * });
 * ```
 */
export function scheduleRefreshes({ onSourceConfirmed, refresh, tag }: ScheduleRefreshesParams): void {
  onSourceConfirmed();
  dispatchRefreshes(refresh, tag);
}

/**
 * Simplified refresh scheduling for relayer-based flows where confirmation
 * is already handled via response.wait().
 *
 * @example
 * ```ts
 * response.wait().then(result => {
 *   if (isSuccessful(result)) {
 *     executeRefreshSchedule(config.refresh, 'polymarketWithdrawal');
 *   }
 * });
 * ```
 */
export function executeRefreshSchedule(refresh: RefreshConfig, tag: string): void {
  dispatchRefreshes(refresh, tag);
}
