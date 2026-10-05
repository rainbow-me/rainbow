import messaging from '@react-native-firebase/messaging';
import { gretch } from 'gretchen';
import { beforeEach, describe, expect, test, vi, type Mock } from 'vitest';

import { logger } from '@/logger';
import { getFCMToken } from '@/notifications/tokens';
import { delay } from '@/utils/delay';

import { getWalletKitClient } from '../services/client';
import { initWalletConnectPushNotifications } from './listeners';

vi.mock('@react-native-firebase/messaging', () => ({ default: vi.fn() }));
vi.mock('gretchen', () => ({
  gretch: vi.fn(),
}));
vi.mock('@/logger', () => ({
  RainbowError: class RainbowError extends Error {},
  logger: {
    DebugContext: { walletconnect: 'walletconnect' },
    error: vi.fn(),
    warn: vi.fn(),
  },
}));
vi.mock('@/notifications/tokens', () => ({
  getFCMToken: vi.fn(),
}));
vi.mock('@/utils/delay', () => ({
  delay: vi.fn(),
}));
vi.mock('../services/client', () => ({
  getWalletKitClient: vi.fn(),
}));
vi.mock('@/env', () => ({
  IS_DEV: false,
}));
vi.mock('@/handlers/appEvents', () => ({
  events: { emit: vi.fn() },
}));
vi.mock('@/performance/tracking', () => ({
  PerformanceReportSegments: { appStartup: { initWalletConnect: 'initWalletConnect' } },
  PerformanceReports: { appStartup: 'appStartup' },
  PerformanceTracking: {
    finishReportSegment: vi.fn(),
    startReportSegment: vi.fn(),
  },
}));
vi.mock('../services/syncClient', () => ({
  setSyncWalletKitClient: vi.fn(),
}));
vi.mock('./onSessionProposal', () => ({
  onSessionProposal: vi.fn(),
}));
vi.mock('./onSessionRequest', () => ({
  onSessionRequest: vi.fn(),
}));

const mockDelay = delay as Mock;
const mockGetClientId = vi.fn();
const mockGetFCMToken = getFCMToken as Mock;
const mockGetWalletKitClient = getWalletKitClient as Mock;
const mockGretch = gretch as Mock;
const mockLogger = logger as unknown as {
  error: Mock;
  warn: Mock;
};
const mockMessaging = messaging as unknown as Mock;
const mockOnTokenRefresh = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();

  mockMessaging.mockReturnValue({ onTokenRefresh: mockOnTokenRefresh });
  mockGetFCMToken.mockResolvedValue('fcm-token');
  mockGetClientId.mockResolvedValue('client-id');
  mockGetWalletKitClient.mockResolvedValue({
    core: {
      crypto: {
        getClientId: mockGetClientId,
      },
    },
  });
  mockDelay.mockResolvedValue(undefined);
});

describe('initWalletConnectPushNotifications', () => {
  test('retries HTTPTimeout errors and does not warn when retries are exhausted', async () => {
    // gretchen does produce this error on Timeout
    const timeoutError = new Error('Request timed out');
    timeoutError.name = 'HTTPTimeout';
    mockEchoServerResponse({ error: timeoutError });
    mockEchoServerResponse({ error: timeoutError });
    mockEchoServerResponse({ error: timeoutError });

    await initWalletConnectPushNotifications();

    expect(mockGretch).toHaveBeenCalledTimes(3);
    expect(mockDelay).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenNthCalledWith(1, 1_000);
    expect(mockDelay).toHaveBeenNthCalledWith(2, 2_000);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  test('retries network errors and does not warn if retry succeeds', async () => {
    mockEchoServerResponse({ error: new TypeError('Network request failed') });
    mockEchoServerResponse();

    await initWalletConnectPushNotifications();

    expect(mockGretch).toHaveBeenCalledTimes(2);
    expect(mockDelay).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).not.toHaveBeenCalled();
  });

  test('warns without retrying for non-transient errors', async () => {
    const parseError = new SyntaxError('JSON Parse error: Unexpected character: <');
    mockEchoServerResponse({ error: parseError });

    await initWalletConnectPushNotifications();

    expect(mockGretch).toHaveBeenCalledTimes(1);
    expect(mockDelay).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalledWith(`[walletConnect]: echo server subscription failed`, {
      error: parseError,
    });
  });
});

function mockEchoServerResponse({ error }: { error?: unknown } = {}) {
  mockGretch.mockReturnValueOnce({
    json: vi.fn().mockResolvedValue(error ? { error } : { data: {} }),
  });
}
