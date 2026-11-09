import React, { act, useLayoutEffect, type ReactElement } from 'react';

import { type ReactNativeType } from 'react-native/types_generated/Libraries/Renderer/shims/ReactNativeTypes.d';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { ChainId } from '@/features/network/types/backendNetworks';

import { useSendChainState } from './useSendChainState';

vi.mock('@/handlers/web3', async () => {
  const { StaticJsonRpcProvider } = await import('@ethersproject/providers');
  return {
    getProvider: ({ chainId }: { chainId: ChainId }) => new StaticJsonRpcProvider('http://localhost:8545', chainId),
    isL2Chain: () => false,
  };
});

const renderer = await vi.importActual<ReactNativeType>('react-native/Libraries/Renderer/implementations/ReactNativeRenderer-dev');
const renderedChains: [chainId: ChainId, providerChainId: number][] = [];
const pollingEvents: (ChainId | 'stop')[] = [];
const startPollingGasFees = (chainId: ChainId) => {
  pollingEvents.push(chainId);
};
const stopPollingGasFees = () => {
  pollingEvents.push('stop');
};

function Send({ chainId }: { chainId?: ChainId }) {
  const { currentChainId, currentProvider } = useSendChainState({
    selectedAssetChainId: chainId,
    startPollingGasFees,
    stopPollingGasFees,
  });
  useLayoutEffect(() => {
    renderedChains.push([currentChainId, currentProvider.network.chainId]);
  });
  return null;
}

function render(element: ReactElement): void {
  act(() => renderer.render(element, 111, undefined, undefined));
  act(() => vi.runAllTimers());
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  act(() => renderer.unmountComponentAtNode(111));
  vi.runAllTimers();
  vi.useRealTimers();
});

it('keeps the chain and provider aligned through asset selection and clearing, with one polling lifecycle per chain', () => {
  render(<Send />);
  render(<Send chainId={ChainId.base} />);
  render(<Send chainId={ChainId.base} />);
  render(<Send />);
  render(<></>);

  expect(renderedChains).toEqual([
    [ChainId.mainnet, ChainId.mainnet],
    [ChainId.base, ChainId.base],
    [ChainId.base, ChainId.base],
    [ChainId.mainnet, ChainId.mainnet],
  ]);
  expect(pollingEvents).toEqual([ChainId.mainnet, 'stop', ChainId.base, 'stop', ChainId.mainnet, 'stop']);
});
