import { LOG_LEVEL, LOG_DEBUG } from 'react-native-dotenv';
import format from 'date-fns/format';

import * as env from '@/env';
import { DebugContext } from '@/logger/debugContext';

export enum LogLevel {
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
}
type Transport = (level: LogLevel, message: string, extra: Extra) => void;
type Extra = Record<string, unknown>;

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
export function defaultTransport(
  level: LogLevel,
  message: string,
  extra: Extra
) {
  const timestamp = format(new Date(), 'HH:mm:ss');
  const metadata = Object.keys(extra).length
    ? ' ' + JSON.stringify(extra, null, '  ')
    : '';

  console.log(`${timestamp} [${level.toUpperCase()}] ${message}${metadata}`);
}

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

  debug(message: string, context?: string) {
    if (context && !this.debugContextRegexes.find(reg => reg.test(context)))
      return;
    this.transport(LogLevel.Debug, message, {});
  }

  info(message: string, extra: Extra = {}) {
    this.transport(LogLevel.Info, message, extra);
  }

  warn(message: string, extra: Extra = {}) {
    this.transport(LogLevel.Warn, message, extra);
  }

  error(error: Error, message: string, extra: Extra = {}) {
    this.transport(LogLevel.Error, message, extra);
    if (error.stack && env.IS_DEV)
      this.transport(LogLevel.Error, error.stack, {});
  }

  addTransport(transport: Transport) {
    this.transports.push(transport);
    return () => {
      this.transports.splice(this.transports.indexOf(transport), 1);
    };
  }

  protected transport(level: LogLevel, message: string, extra: Extra) {
    if (!this.enabled) return;
    if (!enabledLogLevels[this.level].includes(level)) return;

    for (const transport of this.transports) {
      transport(level, message, extra);
    }
  }
}

/**
 * Rainbow's logger. See `@/logger/README` for docs.
 *
 * Basic usage:
 *
 *   `logger.debug(message[, debugContext])`
 *   `logger.info(message[, extra])`
 *   `logger.warn(message[, extra])`
 *   `logger.error(error, message[, extra])`
 */
export const logger = new Logger();

if (env.IS_DEV) {
  logger.addTransport(defaultTransport);
} else if (env.IS_PROD) {
  // TODO sentry
}
