export const RAINBOW_FETCH_ERROR = 'rainbowFetchError';

export interface RainbowFetchRequestOpts extends RequestInit {
  abortController?: AbortController | null;
  params?: ConstructorParameters<typeof URLSearchParams>[0]; // type of first argument of URLSearchParams constructor.
  timeout?: number;
}

/**
 * rainbowFetch fetches data and handles response edge cases and error handling.
 */
export type RainbowFetchResponse<T> = {
  data: T;
  headers: Headers;
  status: number;
};

export async function rainbowFetch<T>(url: RequestInfo, opts: RainbowFetchRequestOpts): Promise<RainbowFetchResponse<T>> {
  // eslint-disable-next-line no-param-reassign
  opts = {
    headers: {},
    method: 'get',
    timeout: 30000, // 30 secs
    ...opts, // Any other fetch options
  };

  if (!url) throw new Error('rainbowFetch: Missing url argument');

  const { abortController: userAbortController, body, headers, params, ...otherOpts } = opts;

  const abortController = userAbortController ?? new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), opts.timeout);
  const requestBody = body && typeof body === 'object' ? JSON.stringify(opts.body) : opts.body;

  try {
    let response: Response;
    try {
      response = await fetch(`${url}${createParams(params)}`, {
        ...otherOpts,
        body: requestBody,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: abortController.signal,
      });
    } catch (fetchError) {
      // fetch() only throws on network failures (TypeError) and abort signals (AbortError).
      // Abort errors are re-thrown as-is so callers can detect them via error.name === 'AbortError'.
      if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
        throw fetchError;
      }
      throw new RainbowFetchError({
        message: fetchError instanceof Error ? fetchError.message : 'Network request failed',
        requestBody: body,
      });
    }

    const responseBody = await getBody(response);

    if (response.ok) {
      const { headers, status } = response;
      return { data: responseBody, headers, status };
    } else {
      const errorResponseBody = typeof responseBody === 'string' ? { error: responseBody } : responseBody;
      const message =
        errorResponseBody?.error || errorResponseBody?.message || response?.statusText || 'There was an error with the request.';

      throw new RainbowFetchError({
        message,
        response,
        responseBody: errorResponseBody,
        requestBody: body,
      });
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getBody(response: Response) {
  const contentType = response.headers.get('Content-Type');
  if (contentType?.startsWith('application/json')) {
    return response.json();
  } else {
    return response.text();
  }
}

function createParams(params: RainbowFetchRequestOpts['params']) {
  return params ? `?${new URLSearchParams(params)}` : '';
}

export class RainbowFetchError extends Error {
  response?: Response;
  responseBody?: any;
  requestBody?: RequestInit['body'];

  constructor({
    message,
    response,
    responseBody,
    requestBody,
  }: {
    message: string;
    response?: Response;
    responseBody?: any;
    requestBody?: RequestInit['body'];
  }) {
    super(message);
    this.name = 'RainbowFetchError';
    this.response = response;
    this.responseBody = responseBody;
    this.requestBody = requestBody;
  }
}

interface RainbowFetchClientOpts extends RainbowFetchRequestOpts {
  baseURL?: string;
}

export class RainbowFetchClient {
  baseURL: string;
  opts: RainbowFetchRequestOpts;

  constructor(opts: RainbowFetchClientOpts = {}) {
    const { baseURL = '', ...otherOpts } = opts;
    this.baseURL = baseURL;
    this.opts = otherOpts;
  }

  /**
   * Perform a GET request with the RainbowFetchClient.
   */
  get<T = any>(url?: RequestInfo, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      method: 'get',
    });
  }

  /**
   * Perform a DELETE request with the RainbowFetchClient.
   */
  delete<T = any>(url?: RequestInfo, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      method: 'delete',
    });
  }

  /**
   * Perform a HEAD request with the RainbowFetchClient.
   */
  head<T = any>(url?: RequestInfo, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      method: 'head',
    });
  }

  /**
   * Perform a OPTIONS request with the RainbowFetchClient.
   */
  options<T = any>(url?: RequestInfo, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      method: 'options',
    });
  }

  /**
   * Perform a POST request with the RainbowFetchClient.
   */
  post<T = any>(url?: RequestInfo, body?: any, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      body,
      method: 'post',
    });
  }

  /**
   * Perform a PUT request with the RainbowFetchClient.
   */
  put<T = any>(url?: RequestInfo, body?: any, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      body,
      method: 'put',
    });
  }

  /**
   * Perform a PATCH request with the RainbowFetchClient.
   */
  patch<T = any>(url?: RequestInfo, body?: any, opts?: RainbowFetchRequestOpts) {
    return rainbowFetch<T>(`${this.baseURL}${url}`, {
      ...this.opts,
      ...opts,
      body,
      method: 'patch',
    });
  }
}
