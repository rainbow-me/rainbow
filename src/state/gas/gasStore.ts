import create from 'zustand';

import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';

import { createStore } from '@/state/internal/createStore';
import { withSelectors } from '@/state/internal/withSelectors';

export interface GasStore {
  selectedGasSpeed: GasSpeed;
  selectedGas: GasFeeParams | GasFeeLegacyParams;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed;
  customGasModified: boolean;
  setCustomSpeed: (speed: GasFeeParams) => void;
  setSelectedGasSpeed: (speed: GasSpeed) => void;
  setSelectedGas: ({ selectedGas }: { selectedGas: GasFeeParams | GasFeeLegacyParams }) => void;
  setGasFeeParamsBySpeed: ({ gasFeeParamsBySpeed }: { gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed }) => void;
  clearCustomGasModified: () => void;
}

export const gasStore = createStore<GasStore>(
  (set, get) => ({
    selectedGasSpeed: GasSpeed.NORMAL,
    selectedGas: {} as GasFeeParams | GasFeeLegacyParams,
    gasFeeParamsBySpeed: {} as GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed,
    customGasModified: false,
    setSelectedGasSpeed: (speed: GasSpeed) => {
      set({
        selectedGasSpeed: speed,
      });
    },
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

export const useGasStore = withSelectors(create(gasStore));
