import { LOG_LEVEL, LOG_DEBUG } from 'react-native-dotenv';
import format from 'date-fns/format';
import * as Sentry from '@sentry/react-native';

import * as env from '@/env';
import { DebugContext } from '@/logger/debugContext';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}

type Transport = (
  level: LogLevel,
  message: string | RainbowError,
  metadata: Metadata
) => void;

/**
 * A union of some of Sentry's breadcrumb properties as well as Sentry's
 * `captureException` parameter, `CaptureContext`.
 */
type Metadata = {
  /**
   * Applied as Sentry breadcrumb types. Defaults to `default`.
   *
   * @see https://develop.sentry.dev/sdk/event-payloads/breadcrumbs/#breadcrumb-types
   */
  type?:
    | 'default'
    | 'debug'
    | 'error'
    | 'navigation'
    | 'http'
    | 'info'
    | 'query'
    | 'transaction'
    | 'ui'
    | 'user';

  /**
   * Passed through to `Sentry.captureException`
   *
   * @see https://github.com/getsentry/sentry-javascript/blob/903addf9a1a1534a6cb2ba3143654b918a86f6dd/packages/types/src/misc.ts#L65
   */
  tags?: {
    [key: string]:
      | number
      | string
      | boolean
      | bigint
      | symbol
      | null
      | undefined;
  };

  /**
   * Any additional data, passed through to Sentry as `extra` param on
   * exceptions, or the `data` param on breadcrumbs.
   */
  [key: string]: unknown;
} & Parameters<typeof Sentry.captureException>[1];

const enabledLogLevels: {
  [key in LogLevel]: LogLevel[];
} = {
  [LogLevel.Debug]: [
    LogLevel.Debug,
    LogLevel.Info,
    LogLevel.Warn,
    LogLevel.Error,
  ],
  [LogLevel.Info]: [LogLevel.Info, LogLevel.Warn, LogLevel.Error],
  [LogLevel.Warn]: [LogLevel.Warn, LogLevel.Error],
  [LogLevel.Error]: [LogLevel.Error],
};

/**
 * Used in dev mode to nicely log to the console
 */
export const consoleTransport: Transport = (level, message, metadata) => {
  const timestamp = format(new Date(), 'HH:mm:ss');
  const extra = Object.keys(metadata).length
    ? ' ' + JSON.stringify(metadata, null, '  ')
    : '';

  console.log(`${timestamp} [${level.toUpperCase()}] ${message}${extra}`);
};

export const sentryTransport: Transport = (
  level,
  message,
  { type, tags, ...metadata }
) => {
  /**
   * If a string, report a breadcrumb
   */
  if (typeof message === 'string') {
    const severity = {
      [LogLevel.Debug]: Sentry.Severity.Debug,
      [LogLevel.Info]: Sentry.Severity.Info,
      [LogLevel.Warn]: Sentry.Severity.Warning,
      [LogLevel.Error]: Sentry.Severity.Error,
    }[level];

    Sentry.addBreadcrumb({
      message,
      data: metadata,
      type: type || 'default',
      level: severity,
      timestamp: Date.now(),
    });
  } else {
    /**
     * It's otherwise an Error and should be reported as onReady
     */
    Sentry.captureException(message, {
      tags,
      extra: metadata,
    });
  }
};

export class RainbowError extends Error {}

/**
 * Main class. Defaults are provided in the constructor so that subclasses are
 * technically possible, if we need to go that route in the future.
 */
export class Logger {
  LogLevel = LogLevel;
  DebugContext = DebugContext;

  enabled: boolean;
  level: LogLevel;
  transports: Transport[] = [];

  protected debugContextRegexes: RegExp[] = [];

  constructor({
    enabled = !env.IS_TEST,
    level = LOG_LEVEL as LogLevel,
    debug = LOG_DEBUG || '',
  }: {
    enabled?: boolean;
    level?: LogLevel;
    debug?: string;
  } = {}) {
    this.enabled = enabled !== false;
    this.level = debug ? LogLevel.Debug : level ?? LogLevel.Warn;
    this.debugContextRegexes = (debug || '').split(',').map(context => {
      return new RegExp(context.replace('/', '\\/').replace('*', '.*'));
    });
  }

  debug(message: string, metadata: Metadata = {}, context?: string) {
    if (context && !this.debugContextRegexes.find(reg => reg.test(context)))
      return;
    this.transport(LogLevel.Debug, message, metadata);
  }

  info(message: string, metadata: Metadata = {}) {
    this.transport(LogLevel.Info, message, metadata);
  }

  warn(message: string, metadata: Metadata = {}) {
    this.transport(LogLevel.Warn, message, metadata);
  }

  error(error: RainbowError, metadata: Metadata = {}) {
    if (error instanceof RainbowError) {
      this.transport(LogLevel.Error, error, metadata);
    } else {
      this.transport(
        LogLevel.Error,
        new RainbowError(`logger.error was not provided a RainbowError`),
        metadata
      );
    }
  }

  addTransport(transport: Transport) {
    this.transports.push(transport);
    return () => {
      this.transports.splice(this.transports.indexOf(transport), 1);
    };
  }

  protected transport(
    level: LogLevel,
    message: string | RainbowError,
    metadata: Metadata
  ) {
    if (!this.enabled) return;
    if (!enabledLogLevels[this.level].includes(level)) return;

    for (const transport of this.transports) {
      transport(level, message, metadata);
    }
  }
}

/**
 * Rainbow's logger. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, metadata, debugContext])`
 *   `logger.info(message[, metadata])`
 *   `logger.warn(message[, metadata])`
 *   `logger.error(error[, metadata])`
 */
export const logger = new Logger();

/**
 * Report to console in dev, Sentry in prod, nothing in test.
 */
if (env.IS_DEV) {
  logger.addTransport(consoleTransport);
} else if (env.IS_PROD) {
  logger.addTransport(sentryTransport);
}
