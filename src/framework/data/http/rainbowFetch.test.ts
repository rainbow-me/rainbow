import { rainbowFetch, RainbowFetchError } from '@/framework/data/http/rainbowFetch';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('rainbowFetch', () => {
  test('throws RainbowFetchError with reportToSentry false for 5xx responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        statusText: 'Internal Server Error',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const promise = rainbowFetch('https://example.com', {});
    await expect(promise).rejects.toThrow(RainbowFetchError);
    await expect(promise).rejects.toMatchObject({ reportToSentry: false });
  });

  test('throws RainbowFetchError with reportToSentry true for 4xx responses', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const promise = rainbowFetch('https://example.com', {});
    await expect(promise).rejects.toThrow(RainbowFetchError);
    await expect(promise).rejects.toMatchObject({ reportToSentry: true });
  });

  test('throws RainbowFetchError with reportToSentry false for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    const promise = rainbowFetch('https://example.com', {});
    await expect(promise).rejects.toThrow(RainbowFetchError);
    await expect(promise).rejects.toMatchObject({ reportToSentry: false });
  });

  test('re-throws AbortError without wrapping', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    const promise = rainbowFetch('https://example.com', {});
    await expect(promise).rejects.toThrow(abortError);
    await expect(promise).rejects.not.toBeInstanceOf(RainbowFetchError);
  });
});
