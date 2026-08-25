import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

import { getTelemetryErrorReason, type TelemetryErrorReason } from './getTelemetryErrorReason';

function fetchError(status?: number, message = 'failed') {
  return new RainbowFetchError({ message, response: status === undefined ? undefined : ({ status } as unknown as Response) });
}

describe('getTelemetryErrorReason', () => {
  const cases: { name: string; input: unknown; expected: TelemetryErrorReason }[] = [
    { name: 'fetch error with 500', input: fetchError(500), expected: 'server_error' },
    { name: 'fetch error with 503', input: fetchError(503), expected: 'server_error' },
    { name: 'fetch error with 400', input: fetchError(400), expected: 'client_error' },
    { name: 'fetch error with 404', input: fetchError(404), expected: 'client_error' },
    { name: 'fetch error without a response', input: fetchError(), expected: 'offline' },
    { name: 'wrapped network failure without a response', input: fetchError(undefined, 'Network request failed'), expected: 'offline' },
    { name: 'whatwg-fetch offline error', input: new TypeError('Network request failed'), expected: 'offline' },
    { name: 'other TypeError', input: new TypeError('undefined is not a function'), expected: 'unknown' },
    { name: 'plain Error', input: new Error('boom'), expected: 'unknown' },
    { name: 'non-error value', input: 'boom', expected: 'unknown' },
  ];

  for (const { name, input, expected } of cases) {
    it(`classifies ${name} as ${expected}`, () => {
      expect(getTelemetryErrorReason(input)).toBe(expected);
    });
  }
});
