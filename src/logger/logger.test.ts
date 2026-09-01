import { expect, test } from '@jest/globals';
import * as Sentry from '@sentry/react-native';
import { nanoid } from 'nanoid';

import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';
import { Logger, LogLevel, RainbowError, sentryTransport } from '@/logger';
import { defaultOptions } from '@/logger/sentry';

jest.mock('@sentry/react-native', () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  Severity: {
    Debug: 'debug',
    Info: 'info',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('react-native-version-number', () => ({
  appVersion: '1.0.0',
  buildVersion: '1',
  bundleIdentifier: 'com.test',
}));

describe('general functionality', () => {
  test('default params', () => {
    const logger = new Logger();
    expect(logger.level).toEqual(LogLevel.Warn);
  });

  test('can override default params', () => {
    const logger = new Logger({
      level: LogLevel.Info,
    });
    expect(logger.level).toEqual(LogLevel.Info);
  });

  test('passing debug contexts automatically enables debug mode', () => {
    const logger = new Logger({ debug: 'specific' });
    expect(logger.level).toEqual(LogLevel.Debug);
  });

  test('supports extra metadata', () => {
    const logger = new Logger();

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    const extra = { foo: true };
    logger.warn('message', extra);

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'message', extra);
  });

  test('supports nullish/falsy metadata', () => {
    const logger = new Logger();

    const mockTransport = jest.fn();

    logger.addTransport(mockTransport);

    // @ts-expect-error testing the JS case
    logger.warn('a', null);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'a', {});

    // @ts-expect-error testing the JS case
    logger.warn('b', false);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'b', {});

    // @ts-expect-error testing the JS case
    logger.warn('c', 0);
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Warn, 'c', {});
  });

  test('logger.error keeps a non-RainbowError as the cause', () => {
    const logger = new Logger();
    const mockTransport = jest.fn();
    logger.addTransport(mockTransport);

    const original = new Error('boom');
    logger.error(original as unknown as RainbowError);

    const [, reported] = mockTransport.mock.calls[0] as [LogLevel, RainbowError, unknown];
    expect(reported).toBeInstanceOf(RainbowError);
    expect(reported.message).toBe('logger.error was not provided a RainbowError');
    expect(reported.cause).toBe(original);
  });

  test('a throwing transport does not stop the others or escape to the caller', () => {
    const logger = new Logger();
    const throwing = jest.fn(() => {
      throw new Error('transport exploded');
    });
    const next = jest.fn();
    logger.addTransport(throwing);
    logger.addTransport(next);

    expect(() => logger.error(new RainbowError('x'))).not.toThrow();
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('createServiceLogger debug honors context filtering and prefixes messages', () => {
    const logger = new Logger({
      debug: 'delegation',
    });
    const mockTransport = jest.fn();
    logger.addTransport(mockTransport);

    logger.createServiceLogger('delegation').debug('matched');
    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, '[delegation]: matched', {});

    mockTransport.mockClear();
    logger.createServiceLogger('wallet').debug('ignored');
    expect(mockTransport).not.toHaveBeenCalled();
  });

  test('createServiceLogger error wraps external errors into RainbowError', () => {
    const logger = new Logger({ level: LogLevel.Error });
    const mockTransport = jest.fn();
    logger.addTransport(mockTransport);

    const cause = new Error('boom');
    logger.createServiceLogger('delegation').error(cause, { chainId: 1 });

    expect(mockTransport).toHaveBeenCalledTimes(1);

    const [level, message, metadata] = mockTransport.mock.calls[0];
    expect(level).toBe(LogLevel.Error);
    expect(message).toBeInstanceOf(RainbowError);
    if (!(message instanceof RainbowError)) {
      throw new Error('Expected context logger to wrap errors in RainbowError');
    }

    expect(message.message).toBe('[delegation]: boom');
    expect(message.cause).toBe(cause);
    expect(metadata).toEqual({ chainId: 1 });
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
      timestamp: Date.now() / 1000,
    });

    sentryTransport(LogLevel.Info, message, { type: 'info', prop: true });
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: { prop: true },
      type: 'info',
      level: LogLevel.Info,
      timestamp: Date.now() / 1000,
    });

    sentryTransport(LogLevel.Log, message, {});
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: 'debug',
      timestamp: Date.now() / 1000,
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      tags: undefined,
      extra: {},
    });

    sentryTransport(LogLevel.Warn, message, {});
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      message,
      data: {},
      type: 'default',
      level: 'warning',
      timestamp: Date.now() / 1000,
    });
    expect(Sentry.captureMessage).toHaveBeenCalledWith(message, {
      level: 'warning',
      tags: undefined,
      extra: {},
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

  test('sentryTransport always calls captureException for RainbowError', () => {
    jest.clearAllMocks();

    const fetchError = new RainbowFetchError({ message: 'Internal Server Error' });
    const error = new RainbowError('fetch failed', fetchError);

    sentryTransport(LogLevel.Error, error, { tags: { route: 'api' } });

    expect(Sentry.captureException).toHaveBeenCalledWith(error, {
      tags: { route: 'api' },
      extra: {},
    });
  });

  test('add/remove transport', () => {
    const logger = new Logger();
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
      debug: 'specific',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, {}, 'specific');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('namespaced', () => {
    const message = nanoid();
    const logger = new Logger({
      debug: 'namespace*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, {}, 'namespace');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('ignores inactive', () => {
    const message = nanoid();
    const logger = new Logger({
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

describe('beforeSend filtering', () => {
  const beforeSend = defaultOptions.beforeSend!;
  const dummyEvent = { exception: { values: [{}] } } as Sentry.ErrorEvent;

  test('drops events caused by 5xx RainbowFetchError', () => {
    const fetchError = new RainbowFetchError({ message: 'Internal Server Error', response: { status: 500 } as Response });
    const error = new RainbowError('fetch failed', fetchError);
    const result = beforeSend(dummyEvent, { originalException: error });
    expect(result).toBeNull();
  });

  test('drops events caused by network errors (no response)', () => {
    const fetchError = new RainbowFetchError({ message: 'Network request failed' });
    const error = new RainbowError('fetch failed', fetchError);
    const result = beforeSend(dummyEvent, { originalException: error });
    expect(result).toBeNull();
  });

  test('keeps events caused by 4xx RainbowFetchError', () => {
    const fetchError = new RainbowFetchError({ message: 'Not Found', response: { status: 404 } as Response });
    const error = new RainbowError('fetch failed', fetchError);
    const result = beforeSend(dummyEvent, { originalException: error });
    expect(result).toBe(dummyEvent);
  });

  test('keeps events for non-fetch RainbowErrors', () => {
    const error = new RainbowError('something broke');
    const result = beforeSend(dummyEvent, { originalException: error });
    expect(result).toBe(dummyEvent);
  });
});

describe('redaction', () => {
  const beforeSend = defaultOptions.beforeSend!;
  const beforeBreadcrumb = defaultOptions.beforeBreadcrumb!;

  test('strips the query string from request breadcrumbs', () => {
    const breadcrumb = beforeBreadcrumb(
      { category: 'xhr', type: 'http', data: { method: 'GET', url: `https://api.example.com/?address=0x${'a'.repeat(40)}` } },
      {}
    );

    expect(breadcrumb?.data?.url).toBe('https://api.example.com');
  });

  test('drops a breadcrumb url it cannot parse rather than passing it through', () => {
    const breadcrumb = beforeBreadcrumb({ category: 'xhr', type: 'http', data: { method: 'GET', url: 'not-a-url' } }, {});

    expect(breadcrumb?.data).not.toHaveProperty('url');
  });

  test('leaves breadcrumbs without a url alone', () => {
    const breadcrumb = beforeBreadcrumb({ category: 'console', message: 'hello' }, {});

    expect(breadcrumb).toEqual({ category: 'console', message: 'hello' });
  });

  test('sanitises breadcrumbs on the event, which is where native ones arrive', () => {
    const event: Sentry.ErrorEvent = {
      type: undefined,
      breadcrumbs: [
        {
          category: 'http',
          data: {
            'method': 'GET',
            'url': `https://api.example.com/v1/wallets/0x${'a'.repeat(40)}/positions`,
            'http.query': 'currency=USD',
          },
        },
      ],
    };

    const result = beforeSend(event, {}) as Sentry.ErrorEvent;
    const data = result.breadcrumbs?.[0]?.data;

    expect(data?.url).toBe('https://api.example.com/v1/wallets/:id/positions');
    expect(data).not.toHaveProperty('http.query');
  });

  test('redacts exception values, which no url field covers', () => {
    const event = { exception: { values: [{ value: `missing revert data for 0x${'a'.repeat(40)}` }] } } as Sentry.ErrorEvent;

    const result = beforeSend(event, {}) as Sentry.ErrorEvent;

    expect(result.exception?.values?.[0]?.value).toBe('missing revert data for [address]');
  });

  test('redacts a captureMessage event', () => {
    const event = { message: `Failed to fetch balances for 0x${'a'.repeat(40)}` } as Sentry.ErrorEvent;

    const result = beforeSend(event, {}) as Sentry.ErrorEvent;

    expect(result.message).toBe('Failed to fetch balances for [address]');
  });
});

/**
 * One fixture with an address in every field that can carry a string, so coverage is asserted rather
 * than imagined. A field left untouched below is a decision, not an oversight: add a field here when
 * the SDK starts populating one, and the gap shows up as a failing expectation.
 */
describe('carrier coverage', () => {
  const beforeSend = defaultOptions.beforeSend!;
  const ADDRESS = `0x${'a'.repeat(40)}`;

  const poisoned = () =>
    ({
      type: undefined,
      message: `message ${ADDRESS}`,
      exception: { values: [{ value: `exception ${ADDRESS}` }] },
      breadcrumbs: [
        {
          category: 'console',
          message: `breadcrumb ${ADDRESS}`,
          data: {
            'url': `https://api.example.com/v1/wallets/${ADDRESS}/nfts`,
            'http.query': `address=${ADDRESS}`,
            'arguments': [`console arg ${ADDRESS}`],
            'metadata': { nested: `nested ${ADDRESS}` },
          },
        },
      ],
      extra: { address: ADDRESS, apiErrors: [{ detail: `failed for ${ADDRESS}` }] },
      tags: { note: `tag ${ADDRESS}` },
      contexts: { app: { note: `context ${ADDRESS}` } },
    }) as Sentry.ErrorEvent;

  test('covers messages, exception values, breadcrumbs and metadata', () => {
    const result = beforeSend(poisoned(), {}) as Sentry.ErrorEvent;
    const data = result.breadcrumbs?.[0]?.data;

    expect(result.message).toBe('message [address]');
    expect(result.exception?.values?.[0]?.value).toBe('exception [address]');
    expect(result.breadcrumbs?.[0]?.message).toBe('breadcrumb [address]');
    expect(data?.url).toBe('https://api.example.com/v1/wallets/:id/nfts');
    expect(data?.metadata).toEqual({ nested: 'nested [address]' });
    expect(data?.arguments).toEqual(['console arg [address]']);
    expect(data).not.toHaveProperty('http.query');
    expect(result.extra?.address).toBe('[address]');
    expect(result.extra?.apiErrors).toEqual([{ detail: 'failed for [address]' }]);
  });

  test('leaves tags and contexts alone, which is deliberate', () => {
    const result = beforeSend(poisoned(), {}) as Sentry.ErrorEvent;

    // A tag value is low-cardinality by design, so rewriting one is likelier to break a deliberate
    // tag than to catch a leak. Keeping identifiers out of tags is a convention, not enforced here.
    expect(result.tags?.note).toBe(`tag ${ADDRESS}`);
    // Contexts are SDK-owned: device model, os build, app version. Rewriting them mangles diagnostics.
    expect(result.contexts?.app?.note).toBe(`context ${ADDRESS}`);
  });
});
