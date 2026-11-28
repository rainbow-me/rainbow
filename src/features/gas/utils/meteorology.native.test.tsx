import React, { act } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { useBackendNetworksStore } from '@/features/network/stores/backendNetworksStore';
import { ChainId } from '@/features/network/types/backendNetworks';
import { SOLANA_CHAIN_ID } from '@/features/solana/core/chainId';
import { useConnectedToAnvilStore } from '@/state/connectedToAnvil';

import { rainbowMeteorologyGetData } from './gasFees';
import { useMeteorology } from './meteorology';
import { mockMeteorologyData } from './meteorologyMock';

vi.mock('@/env', () => ({ IS_TEST: true }));
vi.mock('@/helpers/utilities', () => ({ isZero: (value: string) => Number(value) === 0 }));
vi.mock('./parseGas', () => ({ gweiToWei: (value: string) => value }));
vi.mock('./gasFees', () => ({ rainbowMeteorologyGetData: vi.fn() }));
vi.mock('@/react-query', async () => ({
  ...(await import('@/react-query/createQueryKey')),
  queryClient: new (await import('@tanstack/react-query')).QueryClient(),
}));
vi.mock('@/features/network/stores/backendNetworksStore', async () => ({
  useBackendNetworksStore: (await import('@storesjs/stores')).createBaseStore(() => ({
    getMeteorologySupportedChainIds: () => [ChainId.base],
  })),
}));
vi.mock('@/state/connectedToAnvil', async () => ({
  useConnectedToAnvilStore: (await import('@storesjs/stores')).createBaseStore(() => ({ connectedToAnvil: false })),
}));

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const ROOT_TAG = 141;
let client: QueryClient;
let shown: unknown;

function Probe({ chainId, enabled }: { chainId: ChainId; enabled?: boolean }) {
  shown = useMeteorology({ chainId }, { enabled }).data;
  return null;
}
function render(chainId: number, enabled?: boolean) {
  act(() =>
    renderer.render(
      <QueryClientProvider client={client}>
        <Probe chainId={chainId as ChainId} enabled={enabled} />
      </QueryClientProvider>,
      ROOT_TAG,
      undefined,
      undefined
    )
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  shown = undefined;
  client = new QueryClient({ defaultOptions: { queries: { retry: false, cacheTime: 0 } } });
  vi.mocked(rainbowMeteorologyGetData).mockReset().mockResolvedValue({ data: mockMeteorologyData });
  useConnectedToAnvilStore.setState({ connectedToAnvil: false });
  useBackendNetworksStore.setState({ getMeteorologySupportedChainIds: () => [ChainId.base] });
});
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(ROOT_TAG));
  client.clear();
  vi.useRealTimers();
});

it('polls supported EVM chains but stops requests when switched to Solana', async () => {
  render(ChainId.base);
  await act(async () => vi.advanceTimersByTimeAsync(13_000));
  expect(rainbowMeteorologyGetData).toHaveBeenCalledTimes(2);
  render(SOLANA_CHAIN_ID);
  await act(async () => vi.advanceTimersByTimeAsync(36_000));
  expect(rainbowMeteorologyGetData).toHaveBeenCalledTimes(2);
  expect(shown).toBeUndefined();
});

it('stops polling when backend support is removed', async () => {
  render(ChainId.base);
  await act(async () => vi.advanceTimersByTimeAsync(1));
  act(() => useBackendNetworksStore.setState({ getMeteorologySupportedChainIds: () => [] }));
  await act(async () => vi.advanceTimersByTimeAsync(36_000));
  expect(rainbowMeteorologyGetData).toHaveBeenCalledTimes(1);
});

it('preserves caller-disabled queries', async () => {
  render(ChainId.base, false);
  await act(async () => vi.advanceTimersByTimeAsync(36_000));
  expect(rainbowMeteorologyGetData).not.toHaveBeenCalled();
});

it('preserves the existing Anvil mock without making network requests', async () => {
  useConnectedToAnvilStore.setState({ connectedToAnvil: true });
  render(ChainId.anvil);
  await act(async () => vi.advanceTimersByTimeAsync(13_000));
  expect(shown).toEqual(mockMeteorologyData);
  expect(rainbowMeteorologyGetData).not.toHaveBeenCalled();
});
