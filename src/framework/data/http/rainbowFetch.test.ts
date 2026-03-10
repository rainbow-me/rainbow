import { rainbowFetch, RainbowFetchError } from '@/framework/data/http/rainbowFetch';

const mockFetch = jest.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

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
});
