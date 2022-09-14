import { nanoid } from 'nanoid';
import { expect, test } from '@jest/globals';

import { Logger, LogLevel } from '@/logger';

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
    logger.debug(message, 'specific');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('namespaced', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'namespace*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, 'namespace');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('by filepaths', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'src/components/*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, 'src/components/Divider.js');

    expect(mockTransport).toHaveBeenCalledWith(LogLevel.Debug, message, {});
  });

  test('ignores inactive', () => {
    const message = nanoid();
    const logger = new Logger({
      enabled: true,
      debug: 'src/components/*',
    });

    logger.addTransport(mockTransport);
    logger.debug(message, 'src/utils/*');

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

    logger.error(new Error(message), 'custom message');
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Error,
      'custom message',
      {}
    );
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

    logger.error(new Error('original message'), 'custom message');
    expect(mockTransport).toHaveBeenCalledWith(
      LogLevel.Error,
      'custom message',
      {}
    );
  });
});
