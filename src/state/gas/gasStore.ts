import create from 'zustand';

// todo - absolute imports
import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '../../__swaps__/types/gas';

import { createStore } from '../internal/createStore';
import { buildLocalizedTimeUnitString } from '@/__swaps__/utils/time';
import { gasUtils } from '@/utils';

export interface GasStore {
  selectedGas: GasFeeParams | GasFeeLegacyParams;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed;
  customGasModified: boolean;
  setCustomSpeed: (speed: GasFeeParams) => void;
  setSelectedGas: ({ selectedGas }: { selectedGas: GasFeeParams | GasFeeLegacyParams }) => void;
  setGasFeeParamsBySpeed: ({ gasFeeParamsBySpeed }: { gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed }) => void;
  clearCustomGasModified: () => void;
}

export const gasStore = createStore<GasStore>(
  (set, get) => ({
    selectedGas: {
      maxBaseFee: {
        amount: '0',
        display: '0.01',
        gwei: '0',
      },
      maxPriorityFeePerGas: {
        amount: '0',
        display: '0',
        gwei: '0',
      },
      option: GasSpeed.FAST,
      estimatedTime: {
        amount: 12,
        display: buildLocalizedTimeUnitString({ plural: true, short: true, unit: '12' }),
      },
      display: gasUtils.getGasLabel(gasUtils.FAST),
      transactionGasParams: {
        maxPriorityFeePerGas: '0',
        maxFeePerGas: '0',
      },
      gasFee: {},
    } as GasFeeParams | GasFeeLegacyParams,
    gasFeeParamsBySpeed: {} as GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed,
    customGasModified: false,
    setSelectedGas: ({ selectedGas }) => {
      set({
        selectedGas,
      });
    },
    setGasFeeParamsBySpeed: ({ gasFeeParamsBySpeed }) => {
      set({
        gasFeeParamsBySpeed,
      });
    },
    setCustomSpeed: (speed: GasFeeParams) => {
      const { gasFeeParamsBySpeed } = get();
      set({
        gasFeeParamsBySpeed: {
          ...gasFeeParamsBySpeed,
          [GasSpeed.CUSTOM]: speed,
        } as GasFeeParamsBySpeed,
        customGasModified: true,
      });
    },
    clearCustomGasModified: () => {
      set({ customGasModified: false });
    },
  }),
  {
    persist: {
      name: 'gas',
      version: 0,
    },
  }
);

export const useGasStore = create(gasStore);
