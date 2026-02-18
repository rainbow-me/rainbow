import { logger as appLogger, RainbowError } from '@/logger';

/**
 * Creates a logger adapter for external services.
 *
 * Auto-prefixes logs with `[service]:`, adds debug context, and wraps errors in RainbowError.
 *
 * @example
 * createServiceLogger(logger.DebugContext.delegation) // Logs as [delegation]:, filterable via LOG_DEBUG=delegation
 */
export function createServiceLogger(context: string) {
  return new Proxy(appLogger, {
    get(target, prop) {
      // Wrap errors in RainbowError with service prefix
      if (prop === 'error') {
        return (e: Error | string, m?: Record<string, unknown>) => {
          const msg = e instanceof Error ? e.message : e;
          target.error(new RainbowError(`[${context}]: ${msg}`, e as Error), m ?? {});
        };
      }

      // Add prefix + context to debug logs
      if (prop === 'debug') {
        return (msg: string, meta?: Record<string, unknown>) => {
          target.debug(`[${context}]: ${msg}`, meta ?? {}, context);
        };
      }

      // Add prefix to info/warn logs
      if (prop === 'info' || prop === 'warn') {
        return (msg: string, meta?: Record<string, unknown>) => {
          target[prop](`[${context}]: ${msg}`, meta ?? {});
        };
      }

      return target[prop as keyof typeof target];
    },
  });
}
