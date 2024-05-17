import { SharedValue, runOnJS, useSharedValue } from 'react-native-reanimated';
import { useCallback } from 'react';

import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { gasStore } from '@/state/gas/gasStore';
import { GasFeeLegacyParams, GasFeeParams } from '@/__swaps__/types/gas';
import { CUSTOM_GAS_FIELDS } from './useCustomGas';
import { greaterThan } from '@/helpers/utilities';

export const useSwapGas = ({
  inputAsset,
  outputAsset,
}: {
  inputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  outputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
}) => {
  const selectedGas = useSharedValue<GasFeeParams | GasFeeLegacyParams | null>(null);

  // TODO: Keep these in sync with zustand gas store
  const currentBaseFee = useSharedValue<string>('');
  const maxBaseFee = useSharedValue<string>('');
  const priorityFee = useSharedValue<string>('');
  const maxTransactionFee = useSharedValue('');

  const setJSGasOption = useCallback((selectedGas: GasFeeParams | GasFeeLegacyParams) => {
    gasStore.getState().setSelectedGas({ selectedGas });
  }, []);

  const selectGasOption = (option: GasFeeParams | GasFeeLegacyParams) => {
    'worklet';

    selectedGas.value = option;
    runOnJS(setJSGasOption)(option);
  };

  const updateCustomFieldValue = useCallback((field: CUSTOM_GAS_FIELDS, value: string) => {
    switch (field) {
      case CUSTOM_GAS_FIELDS.MAX_BASE_FEE: {
        // TODO: Update zustand store here?
        break;
      }

      case CUSTOM_GAS_FIELDS.PRIORITY_FEE: {
        // TODO: Update zustand store here?
        break;
      }
    }
  }, []);

  const onUpdateField = useCallback(
    (field: CUSTOM_GAS_FIELDS, operation: 'increment' | 'decrement', step = 1) => {
      'worklet';

      switch (field) {
        case CUSTOM_GAS_FIELDS.MAX_BASE_FEE: {
          const text = maxBaseFee.value;

          if (operation === 'decrement' && greaterThan(1, Number(text) - step)) {
            maxBaseFee.value = String(1);
            runOnJS(updateCustomFieldValue)(CUSTOM_GAS_FIELDS.MAX_BASE_FEE, String(1));
            return;
          }

          const maxBaseFeeNumber = Number(text);
          maxBaseFee.value = operation === 'increment' ? String(maxBaseFeeNumber + step) : String(maxBaseFeeNumber - step);
          runOnJS(updateCustomFieldValue)(CUSTOM_GAS_FIELDS.MAX_BASE_FEE, maxBaseFee.value);
          break;
        }

        case CUSTOM_GAS_FIELDS.PRIORITY_FEE: {
          const text = priorityFee.value;

          if (operation === 'decrement' && greaterThan(1, Number(text) - step)) {
            priorityFee.value = String(1);
            runOnJS(updateCustomFieldValue)(CUSTOM_GAS_FIELDS.PRIORITY_FEE, String(1));
            return;
          }

          const priorityFeeNumber = Number(text);
          priorityFee.value = operation === 'increment' ? String(priorityFeeNumber + step) : String(priorityFeeNumber - step);
          runOnJS(updateCustomFieldValue)(CUSTOM_GAS_FIELDS.PRIORITY_FEE, priorityFee.value);
          break;
        }
      }
    },
    [maxBaseFee, priorityFee, updateCustomFieldValue]
  );

  return { selectedGas, currentBaseFee, maxBaseFee, priorityFee, maxTransactionFee, onUpdateField, selectGasOption };
};
