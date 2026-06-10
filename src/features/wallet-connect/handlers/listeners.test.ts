import messaging from '@react-native-firebase/messaging';
import { gretch } from 'gretchen';

import { logger } from '@/logger';
import { getFCMToken } from '@/notifications/tokens';
import { delay } from '@/utils/delay';

import { getWalletKitClient } from '../services/client';
import { initWalletConnectPushNotifications } from './listeners';

jest.mock('@react-native-firebase/messaging', () => jest.fn());
jest.mock('gretchen', () => ({
  gretch: jest.fn(),
}));
jest.mock('@/logger', () => ({
  RainbowError: class RainbowError extends Error {},
  logger: {
    DebugContext: { walletconnect: 'walletconnect' },
    error: jest.fn(),
    warn: jest.fn(),
  },
}));
jest.mock('@/notifications/tokens', () => ({
  getFCMToken: jest.fn(),
}));
jest.mock('@/utils/delay', () => ({
  delay: jest.fn(),
}));
jest.mock('../services/client', () => ({
  getWalletKitClient: jest.fn(),
}));
jest.mock('@/env', () => ({
  IS_DEV: false,
}));
jest.mock('@/handlers/appEvents', () => ({
  events: { emit: jest.fn() },
}));
jest.mock('@/performance/tracking', () => ({
  PerformanceReportSegments: { appStartup: { initWalletConnect: 'initWalletConnect' } },
  PerformanceReports: { appStartup: 'appStartup' },
  PerformanceTracking: {
    finishReportSegment: jest.fn(),
    startReportSegment: jest.fn(),
  },
}));
jest.mock('../services/syncClient', () => ({
  setSyncWalletKitClient: jest.fn(),
}));
jest.mock('./onSessionProposal', () => ({
  onSessionProposal: jest.fn(),
}));
jest.mock('./onSessionRequest', () => ({
  onSessionRequest: jest.fn(),
}));

const mockDelay = delay as jest.Mock;
const mockGetClientId = jest.fn();
const mockGetFCMToken = getFCMToken as jest.Mock;
const mockGetWalletKitClient = getWalletKitClient as jest.Mock;
const mockGretch = gretch as jest.Mock;
const mockLogger = logger as unknown as {
  error: jest.Mock;
  warn: jest.Mock;
};
const mockMessaging = messaging as unknown as jest.Mock;
const mockOnTokenRefresh = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();

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
    json: jest.fn().mockResolvedValue(error ? { error } : { data: {} }),
  });
}
