import { rainbowFetch, RainbowFetchError } from '@/framework/data/http/rainbowFetch';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('rainbowFetch', () => {
  test.each([404, 500])('throws RainbowFetchError with response for HTTP %i', async status => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Request failed' }), {
        status,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const error = await rainbowFetch('https://example.com', {}).catch(e => e);
    expect(error).toBeInstanceOf(RainbowFetchError);
    expect(error.response?.status).toBe(status);
  });

  test('throws RainbowFetchError without response for network errors', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await rainbowFetch('https://example.com', {}).catch(e => e);
    expect(error).toBeInstanceOf(RainbowFetchError);
    expect(error.response).toBeUndefined();
  });

  test.each(['abort', 'timeout', 'already aborted'])('preserves AbortError from %s', async reason => {
    const controller = new AbortController();
    const abortError = new Error('The operation was aborted.');
    abortError.name = 'AbortError';
    if (reason === 'already aborted') controller.abort();

    mockFetch.mockImplementationOnce(async (_, { signal }) => {
      if (reason === 'timeout') {
        await new Promise(resolve => {
          setTimeout(resolve, 0);
        });
      } else {
        controller.abort();
      }

      expect(signal.aborted).toBe(true);
      expect(controller.signal.aborted).toBe(reason !== 'timeout');
      throw abortError;
    });

    const promise = rainbowFetch('https://example.com', { signal: controller.signal, timeout: 0 });
    await expect(promise).rejects.toThrow(abortError);
    await expect(promise).rejects.not.toBeInstanceOf(RainbowFetchError);
  });
});
