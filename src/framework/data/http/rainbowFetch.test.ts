import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { rainbowFetch, RainbowFetchError } from '@/framework/data/http/rainbowFetch';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

function abortError() {
  const error = new Error('The operation was aborted.');
  error.name = 'AbortError';
  return error;
}

function hangUntilAborted() {
  mockFetch.mockImplementation(
    (_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(abortError()));
      })
  );
}

describe('rainbowFetch', () => {
  test('throws RainbowFetchError with response for 5xx responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const error = await rainbowFetch('https://example.com', {}).catch(e => e);
    expect(error).toBeInstanceOf(RainbowFetchError);
    expect(error.response?.status).toBe(500);
  });

  test('throws RainbowFetchError with response for 4xx responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const error = await rainbowFetch('https://example.com', {}).catch(e => e);
    expect(error).toBeInstanceOf(RainbowFetchError);
    expect(error.response?.status).toBe(404);
  });

  test('throws RainbowFetchError without response for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await rainbowFetch('https://example.com', {}).catch(e => e);
    expect(error).toBeInstanceOf(RainbowFetchError);
    expect(error.response).toBeUndefined();
  });

  test('re-throws AbortError without wrapping', async () => {
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValueOnce(abortError);

    const promise = rainbowFetch('https://example.com', {});
    await expect(promise).rejects.toThrow(abortError);
    await expect(promise).rejects.not.toBeInstanceOf(RainbowFetchError);
  });

  test('times out without aborting the caller-owned controller', async () => {
    vi.useFakeTimers();
    hangUntilAborted();
    const abortController = new AbortController();

    const error = rainbowFetch('https://example.com', { abortController, timeout: 1000 }).catch(e => e);
    await vi.advanceTimersByTimeAsync(1000);

    expect(await error).toMatchObject({ name: 'AbortError' });
    expect(abortController.signal.aborted).toBe(false);
  });

  test.each([
    ['abortController', (controller: AbortController) => ({ abortController: controller })],
    ['signal', (controller: AbortController) => ({ signal: controller.signal })],
  ])('cancels the request when the caller aborts its %s', async (_name, toOpts) => {
    hangUntilAborted();
    const controller = new AbortController();

    const promise = rainbowFetch('https://example.com', toOpts(controller));
    controller.abort();

    await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
