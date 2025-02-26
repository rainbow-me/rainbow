import { useMeteorologySuggestions } from '@/__swaps__/utils/meteorology';
import { GasSpeed } from '@/__swaps__/types/gas';
import { ChainId } from '@/state/backendNetworks/types';

const TOKEN_LAUNCH_GAS_LIMIT = '8000000';

type TokenLaunchTransactionOptions = {
  gasLimit: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  gasPrice?: string;
};

export function useTokenLaunchGasOptions({ chainId, gasSpeed }: { chainId: ChainId; gasSpeed: GasSpeed }): {
  transactionOptions: TokenLaunchTransactionOptions;
  isLoading: boolean;
} {
  const { data: gasSuggestions, isLoading } = useMeteorologySuggestions({
    chainId,
    enabled: true,
  });

  const selectedGasSettings = gasSpeed === GasSpeed.CUSTOM ? null : gasSuggestions?.[gasSpeed];

  const transactionOptions: TokenLaunchTransactionOptions = {
    // Using our confirmed gas limit that provides ~15% safety margin
    gasLimit: TOKEN_LAUNCH_GAS_LIMIT,
    ...(selectedGasSettings?.isEIP1559
      ? {
          maxFeePerGas: selectedGasSettings.maxBaseFee,
          maxPriorityFeePerGas: selectedGasSettings.maxPriorityFee,
        }
      : {
          gasPrice: selectedGasSettings?.gasPrice,
        }),
  };

  return {
    transactionOptions,
    isLoading,
  };
}
