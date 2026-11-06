import { createBaseStore, createDerivedStore, shallowEqual } from '@storesjs/stores';

import { weiToGwei } from '@/features/gas/core/gasParams';
import { getEstimatedGasTime } from '@/features/gas/core/getEstimatedGasTime';
import { getSelectedSpeedSuggestion, readSelectedGasSettings, useCustomGasStore } from '@/features/gas/data/gasSettingsStore';
import { useMeteorologyStore } from '@/features/gas/data/meteorologyStore';
import { type GasSettings } from '@/features/gas/types/gas';
import { ChainId } from '@/features/network/types/backendNetworks';
import { formatNumber, greaterThan, lessThan, multiply } from '@/helpers/utilities';
import * as i18n from '@/languages';

import { useSwapsStore } from './swapsStore';

// ============ Selected Gas =================================================== //

export const useSelectedSwapGasSettings = createDerivedStore($ => {
  const chainId = $(useSwapsStore, s => s.inputAsset?.chainId || ChainId.mainnet);
  return readSelectedGasSettings($, chainId);
});

export const useEstimatedSwapGasTime = createDerivedStore($ => {
  const chainId = $(useSwapsStore, s => s.inputAsset?.chainId || ChainId.mainnet);
  const priorityFee = $(useSelectedSwapGasSettings, s => (s?.isEIP1559 ? s.maxPriorityFee : undefined));
  const confirmationTimes = $(useMeteorologyStore, s => s.get(chainId)?.confirmationTimeByPriorityFee);

  return getEstimatedGasTime(confirmationTimes, priorityFee);
});

export const useSwapBaseFeeDisplay = createDerivedStore($ => {
  const chainId = $(useSwapsStore, s => s.inputAsset?.chainId || ChainId.mainnet);
  const baseFee = $(useMeteorologyStore, s => s.get(chainId)?.currentBaseFee);
  const gasTrend = $(useMeteorologyStore, s => s.get(chainId)?.trend);

  return { baseFee: formatNumber(weiToGwei(baseFee ?? '0')), gasTrend };
}, shallowEqual);

// ============ Gas Panel ====================================================== //

type GasPanelDraft = { isEIP1559?: boolean; gasPrice?: string; maxBaseFee?: string; maxPriorityFee?: string };

export const useGasPanelStore = createBaseStore<GasPanelDraft | undefined>(() => undefined);

export function setGasPanelState(update: GasPanelDraft): void {
  const chainId = useSwapsStore.getState().inputAsset?.chainId || ChainId.mainnet;

  useGasPanelStore.setState(state => {
    if (state) return { ...state, ...update };

    const custom = useCustomGasStore.getState()[chainId];
    if (custom) return { ...custom, ...update };

    return { ...getSelectedSpeedSuggestion(chainId), ...update };
  });
}

export const useSwapMaxBaseFee = createDerivedStore($ => {
  const editedBaseFee = $(useGasPanelStore, s => s?.maxBaseFee);
  if (editedBaseFee) return editedBaseFee;

  return $(useSelectedSwapGasSettings, s => (s?.isEIP1559 ? s.maxBaseFee : undefined));
});

export const useSwapMaxPriorityFee = createDerivedStore($ => {
  const editedPriorityFee = $(useGasPanelStore, s => s?.maxPriorityFee);
  if (editedPriorityFee) return editedPriorityFee;

  return $(useSelectedSwapGasSettings, s => (s?.isEIP1559 ? s.maxPriorityFee : undefined));
});

export const useSwapGasPrice = createDerivedStore($ => {
  const editedGasPrice = $(useGasPanelStore, s => s?.gasPrice);
  if (editedGasPrice) return editedGasPrice;

  return $(useSelectedSwapGasSettings, s => (s?.isEIP1559 === false ? s.gasPrice : undefined));
});

export const useSwapGasPanelSettings = createDerivedStore<GasSettings | undefined>($ => {
  const draft = $(useGasPanelStore);
  if (!draft) return $(useSelectedSwapGasSettings);

  const isEIP1559 = draft.isEIP1559 ?? !draft.gasPrice;
  if (!isEIP1559) return { isEIP1559: false, gasPrice: draft.gasPrice ?? '0' };

  return { isEIP1559: true, maxBaseFee: draft.maxBaseFee ?? '0', maxPriorityFee: draft.maxPriorityFee ?? '0' };
});

export const useSwapMaxBaseFeeWarning = createDerivedStore($ => {
  const chainId = $(useSwapsStore, s => s.inputAsset?.chainId || ChainId.mainnet);
  const maxBaseFee = $(useSwapMaxBaseFee);
  const market = $(useMeteorologyStore, s => s.get(chainId));

  if (!maxBaseFee) return null;

  const currentBaseFee = market?.currentBaseFee ?? '0';
  if (lessThan(maxBaseFee, multiply(currentBaseFee, 0.2))) return i18n.t(i18n.l.gas.likely_to_fail);

  const urgent = market?.suggestions.urgent;
  const normal = market?.suggestions.normal;
  const highThreshold = urgent?.isEIP1559 ? multiply(urgent.maxBaseFee, 1.1) : undefined;
  const lowThreshold = normal?.isEIP1559 ? multiply(normal.maxBaseFee, 0.9) : undefined;
  if (highThreshold && greaterThan(maxBaseFee, highThreshold)) return i18n.t(i18n.l.gas.higher_than_suggested);
  if (lowThreshold && lessThan(maxBaseFee, lowThreshold)) return i18n.t(i18n.l.gas.lower_than_suggested);

  return null;
});
