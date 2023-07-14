import { jest, test, expect, beforeEach, afterEach } from '@jest/globals';
import { nanoid } from 'nanoid/non-secure';

import { mocked } from '@/testing/utils';

import store from '@/redux/store';
import { delay } from '@/utils/delay';
import ethereumUtils from '@/utils/ethereumUtils';
import { setHasPendingDeeplinkPendingRedirect, pair } from '@/walletConnect';
import Routes from '@/navigation/routesNames';
import { Navigation } from '@/navigation';
import { scheduleActionOnAssetReceived } from '@/redux/data';
import { walletConnectSetPendingRedirect } from '@/redux/walletconnect';
import { analyticsV2 } from '@/analytics';
import {
  checkIsValidAddressOrDomain,
  isENSAddressFormat,
} from '@/helpers/validators';
import { fetchReverseRecordWithRetry } from '@/utils/profileUtils';

jest.mock('@/redux/store');
jest.mock('@/redux/walletconnect');
jest.mock('@/redux/data', () => ({
  scheduleActionOnAssetReceived: jest.fn(),
}));
jest.mock('@/redux/explorer', () => ({
  emitAssetRequest: jest.fn(),
  emitChartsRequest: jest.fn(),
}));
jest.mock('@/utils/profileUtils', () => ({
  fetchReverseRecordWithRetry: jest.fn(),
}));
jest.mock('@/config/experimentalHooks', () => ({
  PROFILES: 'ENS Profiles',
}));
jest.mock('@/helpers/validators', () => ({
  checkIsValidAddressOrDomain: jest.fn(),
  isENSAddressFormat: jest.fn(),
}));
jest.mock('@/navigation', () => ({
  Navigation: {
    handleAction: jest.fn(),
  },
}));
jest.mock('@/utils/ethereumUtils');
jest.mock('@/walletConnect', () => ({
  pair: jest.fn(),
  setHasPendingDeeplinkPendingRedirect: jest.fn(),
}));
jest.mock('@/utils/delay');
jest.mock('@/analytics');

import handleDeepLink from '../deeplinks';

/**
 * Generates a unique WC URI for each test
 *
 * `urlKey` is our param, just to differentiate between tests and avoid cache
 * hits on `walletConnectURICache`
 */
function generateWCUri({ version }: { version: number }) {
  return `wc:topic@${version}?relay-protocol=protocol&symKey=symKey&urlKey=${nanoid()}`;
}

beforeEach(() => {
  jest.useFakeTimers();

  mocked(store.getState).mockReturnValue({
    // @ts-ignore
    data: {
      isLoadingAssets: false,
    },
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

test(`runs but does nothing`, async () => {
  await handleDeepLink('https://example.com');
});

test(`waits for isLoadingAssets to be falsy`, async () => {
  mocked(store.getState).mockReturnValue({
    // @ts-ignore
    data: {
      isLoadingAssets: true,
    },
  });

  // don't await this, it will never resolve in this test
  handleDeepLink('https://example.com');

  jest.advanceTimersByTime(50);

  mocked(store.getState).mockReturnValue({
    // @ts-ignore
    data: {
      isLoadingAssets: false,
    },
  });

  jest.advanceTimersByTime(50);

  expect(delay).toHaveBeenCalledTimes(1);
});

test(`handles ethereum:// protocol`, async () => {
  await handleDeepLink('ethereum:payment-brunobarbieri.eth@1?value=1e2');
  expect(ethereumUtils.parseEthereumUrl).toHaveBeenCalledTimes(1);
});

test(`handles wc:// protocol`, async () => {
  const uri = generateWCUri({ version: 2 });

  await handleDeepLink(uri);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);

  // call again with same URI, still only called once
  await handleDeepLink(uri);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles wc:// protocol with &connector`, async () => {
  const uri = generateWCUri({ version: 2 }) + '&connector=rainbowkit';

  await handleDeepLink(uri);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);

  // call again with same URI, still only called once
  await handleDeepLink(uri);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles https:// protocol for WalletConnect`, async () => {
  const uri = encodeURIComponent(generateWCUri({ version: 2 }));
  await handleDeepLink(`https://rnbwapp.com/wc?uri=${uri}`);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles https:// protocol for WalletConnect with &connector`, async () => {
  const uri = encodeURIComponent(generateWCUri({ version: 2 }));
  await handleDeepLink(
    `https://rnbwapp.com/wc?uri=${uri}&connector=rainbowkit`
  );
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles rainbow:// protocol for WalletConnect`, async () => {
  const uri = encodeURIComponent(generateWCUri({ version: 1 }));
  await handleDeepLink(`rainbow://wc?uri=${uri}`);
  expect(walletConnectSetPendingRedirect).toHaveBeenCalledTimes(1);
});

test(`handles rainbow:// protocol for WalletConnect v2`, async () => {
  const uri = encodeURIComponent(generateWCUri({ version: 2 }));
  await handleDeepLink(`rainbow://wc?uri=${uri}`);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles rainbow:// protocol for WalletConnect v2 with &connector`, async () => {
  const uri = encodeURIComponent(generateWCUri({ version: 2 }));
  await handleDeepLink(`rainbow://wc?uri=${uri}&connector=rainbowkit`);
  expect(setHasPendingDeeplinkPendingRedirect).toHaveBeenCalledTimes(1);
  expect(pair).toHaveBeenCalledTimes(1);
});

test(`handles https:// protocol for tokens, found asset`, async () => {
  // @ts-ignore just need a truthy value
  mocked(ethereumUtils.getAssetFromAllAssets).mockReturnValueOnce({});

  await handleDeepLink(
    `https://rnbwapp.com/token?addr=0x123`,
    Routes.ADD_CASH_SHEET
  );

  expect(Navigation.handleAction).toHaveBeenCalledTimes(1);

  jest.advanceTimersByTime(50);

  expect(Navigation.handleAction).toHaveBeenCalledWith(
    Routes.EXPANDED_ASSET_SHEET,
    {
      asset: {},
      fromDiscover: true,
      type: 'token',
    }
  );
});

test(`handles https:// protocol for tokens, no asset found`, async () => {
  // @ts-ignore just need a falsy value
  mocked(ethereumUtils.getAssetFromAllAssets).mockReturnValueOnce(undefined);

  await handleDeepLink(
    `https://rnbwapp.com/token?addr=0x123`,
    Routes.WELCOME_SCREEN
  );

  expect(Navigation.handleAction).toHaveBeenCalledTimes(0);

  jest.advanceTimersByTime(50);

  expect(store.dispatch).toHaveBeenCalledTimes(2);
  expect(scheduleActionOnAssetReceived).toHaveBeenCalledTimes(1);
});

test(`handles https:// protocol for f2c, no query params`, async () => {
  await handleDeepLink(`https://rnbwapp.com/f2c`);
  expect(analyticsV2.track).not.toHaveBeenCalled();
});

test(`handles https:// protocol for f2c, ramp`, async () => {
  const provider = 'ramp';
  const sessionId = '123';

  await handleDeepLink(
    `https://rnbwapp.com/f2c?provider=${provider}&sessionId=${sessionId}`
  );

  expect(analyticsV2.track).toHaveBeenCalledWith(
    analyticsV2.event.f2cProviderFlowCompleted,
    {
      provider,
      sessionId,
      success: true,
    }
  );
});

test(`handles https:// protocol for f2c, other provider`, async () => {
  const provider = 'other';
  const sessionId = '123';

  await handleDeepLink(
    `https://rnbwapp.com/f2c?provider=${provider}&sessionId=${sessionId}`
  );

  expect(analyticsV2.track).toHaveBeenCalledWith(
    analyticsV2.event.f2cProviderFlowCompleted,
    {
      provider,
      sessionId,
    }
  );
});

test(`handles https:// protocol for ens profiles`, async () => {
  mocked(checkIsValidAddressOrDomain).mockResolvedValueOnce(true);
  mocked(isENSAddressFormat).mockReturnValueOnce(true);

  await handleDeepLink(`https://rainbow.me/estrattonbailey.eth`);

  expect(fetchReverseRecordWithRetry).toHaveBeenCalledTimes(0);
  expect(Navigation.handleAction).toHaveBeenCalledTimes(1);
});

test(`handles https:// protocol for profile addresses`, async () => {
  mocked(checkIsValidAddressOrDomain).mockResolvedValueOnce(true);
  mocked(isENSAddressFormat).mockReturnValueOnce(false);
  mocked(fetchReverseRecordWithRetry).mockResolvedValue('estrattonbailey.eth');

  await handleDeepLink(`https://rainbow.me/0x123`);

  expect(fetchReverseRecordWithRetry).toHaveBeenCalledTimes(1);
  expect(Navigation.handleAction).toHaveBeenCalledTimes(1);
});
