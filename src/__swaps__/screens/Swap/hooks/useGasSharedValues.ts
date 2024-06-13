import { useSharedValue } from 'react-native-reanimated';
import { GasSettings } from './useCustomGas';

export function useGasSharedValues() {
  const gasSettings = useSharedValue<GasSettings | undefined>(undefined);
  const estimatedGasLimit = useSharedValue<string | undefined>(undefined);
  const enoughFundsForGas = useSharedValue<boolean>(true);

  return {
    gasSettings,
    estimatedGasLimit,
    enoughFundsForGas,
  };
}
