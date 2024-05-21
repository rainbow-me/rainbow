import create from 'zustand';

import { GasFeeLegacyParams, GasFeeLegacyParamsBySpeed, GasFeeParams, GasFeeParamsBySpeed, GasSpeed } from '@/__swaps__/types/gas';

import { createStore } from '@/state/internal/createStore';
import { withSelectors } from '@/state/internal/withSelectors';
import { MeteorologyResponse, MeteorologyLegacyResponse } from '@/__swaps__/utils/meteorology';

export interface GasStore {
  gasData: MeteorologyResponse | MeteorologyLegacyResponse;
  selectedGasSpeed: GasSpeed;
  selectedGas: GasFeeParams | GasFeeLegacyParams;
  gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed;
  customGasModified: boolean;

  currentBaseFee: string;
  currentBaseFeeTrend: number;

  setGasData: (gasData: MeteorologyResponse | MeteorologyLegacyResponse) => void;
  setCustomSpeed: (speed: GasFeeParams) => void;
  setSelectedGasSpeed: (speed: GasSpeed) => void;
  setSelectedGas: ({ selectedGas }: { selectedGas: GasFeeParams | GasFeeLegacyParams }) => void;
  setGasFeeParamsBySpeed: ({ gasFeeParamsBySpeed }: { gasFeeParamsBySpeed: GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed }) => void;
  clearCustomGasModified: () => void;
  setCurrentBaseFee: (baseFee: string) => void;
  setCurrentBaseFeeTrend: (trend: number) => void;
}

export const gasStore = createStore<GasStore>(
  (set, get) => ({
    gasData: {} as MeteorologyResponse | MeteorologyLegacyResponse,
    selectedGasSpeed: GasSpeed.NORMAL,
    selectedGas: {} as GasFeeParams | GasFeeLegacyParams,
    gasFeeParamsBySpeed: {} as GasFeeParamsBySpeed | GasFeeLegacyParamsBySpeed,
    customGasModified: false,

    currentBaseFee: '',
    currentBaseFeeTrend: -1,
    setGasData: (gasData: MeteorologyResponse | MeteorologyLegacyResponse) => {
      set({
        gasData,
      });
    },
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
    setCurrentBaseFee: (baseFee: string) => {
      set({
        currentBaseFee: baseFee,
      });
    },
    setCurrentBaseFeeTrend: (trend: number) => {
      set({
        currentBaseFeeTrend: trend,
      });
    },
  }),
  {
    persist: {
      name: 'gasStore',
      version: 1,
    },
  }
);

export const useGasStore = withSelectors(create(gasStore));
