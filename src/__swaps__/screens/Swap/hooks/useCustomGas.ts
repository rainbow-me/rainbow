import { useGas } from '@/hooks';
import { useCallback } from 'react';
import { runOnJS, useAnimatedReaction, useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { gasUtils } from '@/utils';
import { greaterThan } from '@/__swaps__/utils/numbers';
import { gweiToWei, parseGasFeeParam } from '@/parsers';
import { GasSpeed } from '@/__swaps__/types/gas';

export enum CUSTOM_GAS_FIELDS {
  MAX_BASE_FEE = 'maxBaseFee',
  PRIORITY_FEE = 'priorityFee',
}

const { CUSTOM } = gasUtils;

/**
 * TODO: Work left to do for custom gas
 * 1. Need to add in currentBaseFee for current network
 * 2. Show current gas trend on custom gas panel UI somewhere
 * 3. Allow user to type in both fields (make both animated textinput component)
 *   - will have to figure out how to handle prompting keyboard and dismissing
 * 4. Handle long press on both fields
 * 5. Handle showing warnings (overpaying, might fail, etc.)
 */

export function useCustomGas() {
  const { selectedGasFee, currentBlockParams, updateToCustomGasFee, updateGasFeeOption, gasFeeParamsBySpeed } = useGas();

  const currentBaseFee = useSharedValue<string>(currentBlockParams?.baseFeePerGas?.gwei || 'Unknown');
  const maxBaseFee = useSharedValue<string>(currentBlockParams?.baseFeePerGas?.amount || '1');
  const priorityFee = useSharedValue<string>('1');

  const maxTransactionFee = useDerivedValue(() => {
    const gasPrice = gasFeeParamsBySpeed?.[GasSpeed.CUSTOM]?.maxBaseFee.gwei || '';
    if (gasPrice.trim() === '') return 'Unknown';
    return gasPrice;
  });

  useAnimatedReaction(
    () => currentBlockParams?.baseFeePerGas?.gwei,
    current => {
      currentBaseFee.value = current;
    }
  );

  const updateCustomFieldValue = useCallback(
    (field: CUSTOM_GAS_FIELDS, value: string) => {
      switch (field) {
        case CUSTOM_GAS_FIELDS.MAX_BASE_FEE: {
          const maxBaseFee = parseGasFeeParam(gweiToWei(value || 0));
          const newGasParams = {
            ...selectedGasFee.gasFeeParams,
            maxBaseFee,
          };
          updateToCustomGasFee(newGasParams);
          break;
        }

        case CUSTOM_GAS_FIELDS.PRIORITY_FEE: {
          const priorityFee = parseGasFeeParam(gweiToWei(value || 0));
          const newGasParams = {
            ...selectedGasFee.gasFeeParams,
            maxPriorityFeePerGas: priorityFee,
          };
          updateToCustomGasFee(newGasParams);
          break;
        }
      }
    },
    [selectedGasFee.gasFeeParams, updateToCustomGasFee]
  );

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

  const updateCustomGas = ({ priorityFee, baseFee }: { priorityFee: string; baseFee: string }) => {
    updateGasFeeOption(CUSTOM);
    const maxPriorityFeePerGas = parseGasFeeParam(gweiToWei(priorityFee || 0));
    const maxBaseFee = parseGasFeeParam(gweiToWei(baseFee || 0));

    updateToCustomGasFee({
      ...selectedGasFee.gasFeeParams,
      maxPriorityFeePerGas,
      maxBaseFee,
    });
  };

  const onSaveCustomGas = () => {
    'worklet';

    runOnJS(updateCustomGas)({
      priorityFee: priorityFee.value,
      baseFee: maxBaseFee.value,
    });
  };

  return {
    currentBaseFee,
    maxBaseFee,
    priorityFee,
    maxTransactionFee,
    onUpdateField,
    onSaveCustomGas,
  };
}
