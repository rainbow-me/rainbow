import { useGas } from '@/hooks';
import { useCallback } from 'react';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import { gasUtils } from '@/utils';
import { greaterThan } from '@/__swaps__/utils/numbers';
import { gweiToWei, parseGasFeeParam } from '@/parsers';

export enum CUSTOM_GAS_FIELDS {
  MAX_BASE_FEE = 'maxBaseFee',
  MINER_TIP = 'minerTip',
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
  const { selectedGasFee, updateToCustomGasFee, updateGasFeeOption } = useGas();

  const currentBaseFee = useSharedValue<number>(15);
  const maxBaseFee = useSharedValue<string>('23');
  const minerTip = useSharedValue<string>('1');

  const onUpdateField = useCallback(
    (field: CUSTOM_GAS_FIELDS, operation: 'increment' | 'decrement') => {
      'worklet';

      switch (field) {
        case CUSTOM_GAS_FIELDS.MAX_BASE_FEE: {
          const text = maxBaseFee.value;

          if (greaterThan(0, Number(text))) {
            return;
          }

          const maxBaseFeeNumber = Number(text);
          maxBaseFee.value = operation === 'increment' ? String(maxBaseFeeNumber + 1) : String(maxBaseFeeNumber - 1);
          break;
        }

        case CUSTOM_GAS_FIELDS.MINER_TIP: {
          const text = minerTip.value;

          if (greaterThan(0, Number(text))) {
            return;
          }

          const minerTipNumber = Number(text);
          minerTip.value = operation === 'increment' ? String(minerTipNumber + 1) : String(minerTipNumber - 1);
          break;
        }
      }
    },
    [maxBaseFee, minerTip]
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
      priorityFee: minerTip.value,
      baseFee: maxBaseFee.value,
    });
  };

  return {
    currentBaseFee,
    maxBaseFee,
    minerTip,
    onUpdateField,
    onSaveCustomGas,
  };
}
