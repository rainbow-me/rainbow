import { createDerivedStore } from '@storesjs/stores';
import { afterAll, afterEach, beforeEach, expect, it, vi } from 'vitest';

import * as gasTime from '@/features/gas/core/getEstimatedGasTime';
import {
  setCustomGasSettings,
  setSelectedGasSpeed,
  useCustomGasStore,
  useSelectedGasSpeedStore,
} from '@/features/gas/data/gasSettingsStore';
import { fetchMeteorology } from '@/features/gas/data/meteorology';
import { mockMeteorologyData } from '@/features/gas/data/meteorologyMock';
import { useMeteorologyStore } from '@/features/gas/data/meteorologyStore';
import { GasSpeed } from '@/features/gas/types/gasSpeed';
import { ChainId } from '@/features/network/types/backendNetworks';

import {
  useEstimatedSwapGasTime,
  useGasPanelStore,
  useSwapGasPanelSettings,
  useSwapMaxBaseFee,
  useSwapMaxBaseFeeWarning,
} from './gasStore';

const { swapInputs } = await vi.hoisted(async () => {
  const { createBaseStore } = await import('@storesjs/stores');
  return { swapInputs: createBaseStore<{ inputAsset: { chainId: ChainId } | undefined }>(() => ({ inputAsset: undefined })) };
});

vi.mock('./swapsStore', () => ({ useSwapsStore: swapInputs }));
vi.mock('@/features/gas/data/meteorology', () => ({ fetchMeteorology: vi.fn() }));
vi.mock('@/helpers/time', () => ({ getMinimalTimeUnitStringForMs: (milliseconds: number) => String(milliseconds) }));

const observers: (() => void)[] = [];

beforeEach(() => {
  useSelectedGasSpeedStore.setState({}, true);
  useCustomGasStore.setState({}, true);
  useGasPanelStore.setState(undefined);
  swapInputs.setState({ inputAsset: { chainId: ChainId.mainnet } });
  vi.mocked(fetchMeteorology).mockImplementation(async chainId => ({
    ...mockMeteorologyData,
    data: {
      ...mockMeteorologyData.data,
      currentBaseFee: '100',
      baseFeeSuggestion: '100',
      confirmationTimeByPriorityFee: { '15': '7', '30': '3', '45': '1', '60': '0' },
      maxPriorityFeeSuggestions: { fast: chainId === ChainId.mainnet ? '7' : '1', normal: '3', urgent: '9' },
    },
  }));
});

afterEach(() => {
  for (const stop of observers.splice(0)) stop();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

afterAll(() => useMeteorologyStore.getState().reset());

it('composes without React and follows chain, speed and custom-setting changes', async () => {
  const arrivalTime = createDerivedStore($ => $(useEstimatedSwapGasTime));
  observers.push(arrivalTime.subscribe(vi.fn()));

  await vi.waitFor(() => expect(arrivalTime.getState()).toBe('~15000'));
  setSelectedGasSpeed(ChainId.mainnet, GasSpeed.NORMAL);
  expect(arrivalTime.getState()).toBe('~30000');

  useCustomGasStore.setState({ [ChainId.mainnet]: { isEIP1559: true, maxBaseFee: '200', maxPriorityFee: '1' } });
  setSelectedGasSpeed(ChainId.mainnet, GasSpeed.CUSTOM);
  expect(arrivalTime.getState()).toBe('~45000');

  useCustomGasStore.setState({}, true);
  expect(arrivalTime.getState()).toBe('~15000');

  swapInputs.setState({ inputAsset: { chainId: ChainId.optimism } });
  await vi.waitFor(() => expect(arrivalTime.getState()).toBe('~45000'));

  const calculateTime = vi.spyOn(gasTime, 'getEstimatedGasTime');
  await useMeteorologyStore.getState().load(ChainId.mainnet, { force: true });
  expect(calculateTime).not.toHaveBeenCalled();
});

it('keeps per-field draft fallback and the existing warning boundaries', async () => {
  observers.push(useSwapMaxBaseFeeWarning.subscribe(vi.fn()));
  await useMeteorologyStore.getState().load(ChainId.mainnet, { force: true });

  useGasPanelStore.setState({ maxPriorityFee: '99' });
  expect(useSwapMaxBaseFee.getState()).toBe('100');
  useGasPanelStore.setState({ maxBaseFee: '' });
  expect(useSwapMaxBaseFee.getState()).toBe('100');
  useGasPanelStore.setState({ maxBaseFee: '0' });
  expect(useSwapMaxBaseFee.getState()).toBe('0');

  const warnings: [string, string | null][] = [
    ['19', 'Low · likely to fail'],
    ['20', 'Low · may get stuck'],
    ['89', 'Low · may get stuck'],
    ['90', null],
    ['110', null],
    ['111', 'High · overpaying'],
  ];
  for (const [fee, warning] of warnings) {
    useGasPanelStore.setState({ maxBaseFee: fee });
    expect(useSwapMaxBaseFeeWarning.getState()).toBe(warning);
  }

  useGasPanelStore.setState(undefined);
  setCustomGasSettings(ChainId.mainnet, { isEIP1559: false, gasPrice: '1' });
  setSelectedGasSpeed(ChainId.mainnet, GasSpeed.CUSTOM);
  expect(useCustomGasStore.getState()[ChainId.mainnet]).toEqual({ isEIP1559: false, gasPrice: '1' });
  expect(useSwapMaxBaseFee.getState()).toBeUndefined();
});

it('constructs complete fee-model variants for preview and saving', () => {
  useGasPanelStore.setState({ maxBaseFee: '120' }, true);
  const settings = useSwapGasPanelSettings.getState();
  expect(settings).toEqual({ isEIP1559: true, maxBaseFee: '120', maxPriorityFee: '0' });
  if (!settings) throw new Error('The edited fee must produce settings');

  setCustomGasSettings(ChainId.mainnet, settings);
  expect(useCustomGasStore.getState()[ChainId.mainnet]).toEqual(settings);

  useGasPanelStore.setState({ gasPrice: '3' }, true);
  const legacySettings = useSwapGasPanelSettings.getState();
  expect(legacySettings).toEqual({ isEIP1559: false, gasPrice: '3' });
  if (!legacySettings) throw new Error('The edited gas price must produce settings');

  setCustomGasSettings(ChainId.mainnet, legacySettings);
  expect(useCustomGasStore.getState()[ChainId.mainnet]).toEqual(legacySettings);
});

it('retains collection demand until the final native observer leaves', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] });
  const first = useEstimatedSwapGasTime.subscribe(vi.fn());
  const second = useEstimatedSwapGasTime.subscribe(vi.fn());
  observers.push(first, second);
  await flush();

  first();
  await flush();
  vi.mocked(fetchMeteorology).mockClear();
  await vi.advanceTimersByTimeAsync(13000);
  expect(fetchMeteorology).toHaveBeenCalled();

  second();
  await flush();
  vi.mocked(fetchMeteorology).mockClear();
  await vi.advanceTimersByTimeAsync(26000);
  expect(fetchMeteorology).not.toHaveBeenCalled();
});

function flush(): Promise<void> {
  return new Promise(resolve => {
    setImmediate(resolve);
  });
}
