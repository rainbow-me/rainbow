export const RAINBOW_FETCH_ERROR = 'rainbowFetchError';

/**
 * rainbowFetch fetches data and handles response edgecases and error handling.
 * @param  {string} url  The URL of the resource you want to fetch.
 * @param  {object} [opts] The options.
 * @param  {object} [opts.headers] A headers object to fetch with.
 * @param  {string} [opts.method] A method string to fetch with.
 * @param  {object} [opts.params] Querystring parameters to pass with the request.
 * @param  {number} [opts.timeout] The maxium time to wait before timing out.
 * @param  {object} [opts.body] The object to pass as the body in the request. Must be JSON.stringify-able.
 * @return {Promise<{data: Object, headers: Object, status: number}>} An object with the fetched resource.
 */
export async function rainbowFetch(url, opts) {
  opts = {
    body: undefined,
    headers: {},
    method: 'get',
    params: undefined,
    timeout: 30000, // 30 secs
    ...opts,
    // Any other fetch options
  };

  if (!url) throw new Error('fancyFetch: Missing url argument');

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), opts.timeout);

  const { body, params, headers, ...otherOpts } = opts;

  const requestBody =
    body && typeof body === 'object' ? JSON.stringify(opts.body) : opts.body;

  const response = await fetch(`${url}${createParams(params)}`, {
    ...otherOpts,
    body: requestBody,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: controller.signal,
  });
  clearTimeout(id);

  const responseBody = await getBody(response);

  if (response.ok) {
    const { headers, status } = response;
    return { data: responseBody, headers, status };
  } else {
    const errorResponseBody =
      typeof responseBody === 'string' ? { error: responseBody } : responseBody;

    const error = generateError({
      requestBody: body,
      response,
      responseBody: errorResponseBody,
    });

    throw error;
  }
}

function getBody(response) {
  const contentType = response.headers.get('Content-Type');
  if (contentType && contentType.startsWith('application/json')) {
    return response.json();
  } else {
    return response.text();
  }
}

function createParams(params) {
  return params ? `?${new URLSearchParams(params)}` : '';
}

function generateError({ requestBody, response, responseBody }) {
  const message =
    responseBody?.error ||
    response?.statusText ||
    'There was an error with the request.';

  const error = new Error(message);

  error.response = response;
  error.responseBody = responseBody;
  error.requestBody = requestBody;
  error.type = RAINBOW_FETCH_ERROR;

  return error;
}

export class RainbowFetchClient {
  /**
   * @param  {object} [opts] Any default options you want passed to rainbowFetch.
   * @param  {string} [opts.baseURL] The base URL to make requests off of. e.g. https://example.com.
   * @param  {object} [opts.headers] A headers object to fetch with.
   * @param  {number} [opts.timeout] The maxium time to wait before timing out.
   */
  constructor(opts = {}) {
    const { baseURL = '', ...otherOpts } = opts;
    this.baseURL = baseURL;
    this.opts = otherOpts;
  }

  /**
   * Perform a GET request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  get(url, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      method: 'get',
    });
  }

  /**
   * Perform a DELETE request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  delete(url, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      method: 'delete',
    });
  }

  /**
   * Perform a HEAD request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  head(url, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      method: 'head',
    });
  }

  /**
   * Perform a OPTIONS request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  options(url, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      method: 'options',
    });
  }

  /**
   * Perform a POST request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} body A JSON.strinify-able object to pass as the body to request with.
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  post(url, body, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      body,
      method: 'post',
    });
  }

  /**
   * Perform a PUT request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} body A JSON.strinify-able object to pass as the body to request with.
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  put(url, body, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      body,
      method: 'put',
    });
  }

  /**
   * Perform a PATCH request with the RainbowFetchClient.
   * @param  {string} url  The resource path of the request. e.g. '/users'
   * @param  {object} body A JSON.strinify-able object to pass as the body to request with.
   * @param  {object} [opts] Options object that is passed to rainbowFetch
   * @return {Promise<{data: object, headers: object, status: number}>} An object with the fetched resource.
   */
  patch(url, body, opts) {
    return rainbowFetch(`${this.baseURL}${url}`, {
      ...opts,
      body,
      method: 'patch',
    });
  }
}
