import { nanoid } from 'nanoid';
import { expect, test } from '@jest/globals';
import * as Sentry from '@sentry/react-native';

import { Logger, LogLevel, RainbowError, sentryTransport } from '@/logger';

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  Severity: {
    Debug: 'debug',
    Info: 'info',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('general functionality', () => {
  test('default params', () => {
    const logger = new Logger();
    expect(logger.enabled).toBeFalsy();
    expect(logger.level).toEqual(LogLevel.Warn);
  });

  test('can override default params', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Info,
    });
    expect(logger.enabled).toBeTruthy();
    expect(logger.level).toEqual(LogLevel.Info);
  });

  test('disabled logger does not report', () => {
    const logger = new Logger({
      enabled: false,
      level: LogLevel.Debug,
    });

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);
    logger.debug('message');

    expect(mockTransport).not.toHaveBeenCalled();
  });

  test('disablement', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Debug,
    });

    logger.disable();

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);
    logger.debug('message');

    expect(mockTransport).not.toHaveBeenCalled();
  });

  test('passing debug contexts automatically enables debug mode', () => {
    const logger = new Logger({ debug: 'specific' });
    expect(logger.level).toEqual(LogLevel.Debug);
  });

  test('supports extra metadata', () => {
    const logger = new Logger({ enabled: true });

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    const extra = { foo: true };
    logger.warn('message', extra);

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'message', extra);
  });

  test('supports nullish/falsy metadata', () => {
    const logger = new Logger({ enabled: true });

    const mockTransport = jest.fn();

    const remove = logger.addTransport(mockTransport);

    // @ts-expect-error testing the JS case
    logger.warn('a', null);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'a', {});

    // @ts-expect-error testing the JS case
    logger.warn('b', false);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'b', {});

    // @ts-expect-error testing the JS case
    logger.warn('c', 0);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'c', {});

    remove();

    logger.addTransport((level, message, metadata) => {
      expect(typeof metadata).toEqual('object');
    });

    // @ts-expect-error testing the JS case
    logger.warn('message', null);
  });

  test('logger.error expects a RainbowError', () => {
    const logger = new Logger({ enabled: true });

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    logger.error(new Error());

    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Error,
      new RainbowError(`logger.error was not provided a RainbowError`),
      {}
    );
  });

  test('sentryTransport', () => {
    jest.useFakeTimers();

    const message = 'message';

    sentryTransport(LogLevel.Debug, message, {});

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: LogLevel.Debug,
      timestamp: Date.now(),
    });

    sentryTransport(LogLevel.Info, message, { type: 'info', prop: true });

    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: { prop: true },
      type: 'info',
      level: LogLevel.Info,
      timestamp: Date.now(),
    });

    const e = new RainbowError('error');
    const tags = {
      prop: 'prop',
    };

    sentryTransport(LogLevel.Error, e, {
      tags,
      prop: true,
    });

    expect(Sentry.captureException).toHaveBeenCalledWith(e, {
      tags,
      extra: {
        prop: true,
      },
    });
  });

  test('add/remove transport', () => {
    const logger = new Logger({ enabled: true });
    const mockTransport = jest.fn();

    const remove = logger.addTransport(mockTransport);

    logger.warn('warn');

    remove();

    logger.warn('warn');

    // only called once bc it was removed
    expect(mockTransport).toHaveBeenNthCalledWith(1, LogLevel.Warn, 'warn', {});
  });
});

describe('debug contexts', () => {
  const mockTransport = jest.fn();

  test('specific', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'specific',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, {}, 'specific');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('namespaced', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'namespace*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, {}, 'namespace');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('ignores inactive', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'namespace:foo:*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, {}, 'namespace:bar:baz');

    expect(mockTransport).not.toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });
});

describe('supports levels', () => {
  test('debug', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Debug,
    });
    const message = nanoid();
    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    logger.debug(message);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});

    logger.info(message);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Info, message, {});

    logger.warn(message);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, message, {});

    const e = new RainbowError(message);
    logger.error(e);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, e, {});
  });

  test('info', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Info,
    });
    const message = nanoid();
    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    logger.debug(message);
    expect(mockTransport).not.toHaveBeenCalled();

    logger.info(message);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Info, message, {});
  });

  test('warn', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Warn,
    });
    const message = nanoid();
    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    logger.debug(message);
    expect(mockTransport).not.toHaveBeenCalled();

    logger.info(message);
    expect(mockTransport).not.toHaveBeenCalled();

    logger.warn(message);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, message, {});
  });

  test('error', () => {
    const logger = new Logger({
      enabled: true,
      level: LogLevel.Error,
    });
    const message = nanoid();
    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    logger.debug(message);
    expect(mockTransport).not.toHaveBeenCalled();

    logger.info(message);
    expect(mockTransport).not.toHaveBeenCalled();

    logger.warn(message);
    expect(mockTransport).not.toHaveBeenCalled();

    const e = new RainbowError('original message');
    logger.error(e);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Error, e, {});
  });
});
