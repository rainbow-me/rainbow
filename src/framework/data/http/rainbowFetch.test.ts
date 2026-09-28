import { afterAll, beforeEach, expect, test, vi } from 'vitest';

import { rainbowFetch, RainbowFetchError } from '@/framework/data/http/rainbowFetch';

const fetchMock = vi.spyOn(global, 'fetch');

beforeEach(() => {
  fetchMock.mockReset();
});
afterAll(() => {
  fetchMock.mockRestore();
});

test.each([404, 500])('includes the response in HTTP %i errors', async status => {
  fetchMock.mockResolvedValueOnce(new Response('{"error":"Request failed"}', { status, headers: { 'Content-Type': 'application/json' } }));
  await expect(rainbowFetch('https://example.test', {})).rejects.toMatchObject({
    name: 'RainbowFetchError',
    response: { status },
  });
});

test('reports network failures without a response', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
  await expect(rainbowFetch('https://example.test', {})).rejects.toMatchObject({
    name: 'RainbowFetchError',
    message: 'Network request failed',
    response: undefined,
  });
});

test.each(['abort', 'timeout', 'already aborted'])('preserves AbortError from %s', async reason => {
  const controller = new AbortController();
  const abortError = new Error('The operation was aborted.');
  abortError.name = 'AbortError';
  if (reason === 'already aborted') controller.abort();

  fetchMock.mockImplementationOnce(async (_, options) => {
    if (reason === 'timeout')
      await new Promise(resolve => {
        setTimeout(resolve, 0);
      });
    else controller.abort();
    expect(options?.signal?.aborted).toBe(true);
    expect(controller.signal.aborted).toBe(reason !== 'timeout');
    throw abortError;
  });

  const request = rainbowFetch('https://example.test', { signal: controller.signal, timeout: 0 });
  await expect(request).rejects.toBe(abortError);
  await expect(request).rejects.not.toBeInstanceOf(RainbowFetchError);
});
