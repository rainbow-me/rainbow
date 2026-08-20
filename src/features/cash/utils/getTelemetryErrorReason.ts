import { RainbowFetchError } from '@/framework/data/http/rainbowFetch';

export type TelemetryErrorReason = 'offline' | 'client_error' | 'server_error' | 'unknown';

export function getTelemetryErrorReason(error: unknown): TelemetryErrorReason {
  if (error instanceof RainbowFetchError) {
    const status = error.response?.status;
    if (status !== undefined && status >= 500) return 'server_error';
    if (status !== undefined && status >= 400) return 'client_error';
    // rainbowFetch wraps network failures in a response-less RainbowFetchError, preserving the message.
    if (error.response === undefined) return 'offline';
    return 'unknown';
  }
  if (error instanceof TypeError && error.message === 'Network request failed') return 'offline';
  return 'unknown';
}
