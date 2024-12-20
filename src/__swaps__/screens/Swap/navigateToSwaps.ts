import { GasSpeed } from '@/__swaps__/types/gas';
import { Navigation } from '@/navigation';
import store from '@/redux/store';
import { SwapsState, useSwapsStore } from '@/state/swaps/swapsStore';
import { setSelectedGasSpeed } from './hooks/useSelectedGas';
import { enableActionsOnReadOnlyWallet } from '@/config';
import walletTypes from '@/helpers/walletTypes';
import { watchingAlert } from '@/utils';
import Routes from '@/navigation/routesNames';

export type SwapsParams = Partial<
  Pick<SwapsState, 'inputAsset' | 'outputAsset' | 'percentageToSell' | 'slippage'> & {
    inputAmount: string;
    outputAmount: string;
    gasSpeed: GasSpeed;
  }
>;

const isCurrentWalletReadOnly = () => store.getState().wallets.selected?.type === walletTypes.readOnly;

export async function navigateToSwaps({ gasSpeed, ...params }: SwapsParams) {
  if (!enableActionsOnReadOnlyWallet && isCurrentWalletReadOnly()) {
    return watchingAlert();
  }

  const chainId = params.inputAsset?.chainId || params.outputAsset?.chainId || store.getState().settings.chainId;
  useSwapsStore.setState(params);

  if (gasSpeed && chainId) setSelectedGasSpeed(chainId, gasSpeed);

  Navigation.handleAction(Routes.SWAP, params);
}

const getInputMethod = (params: SwapsParams) => {
  if (params.percentageToSell) return 'slider';
  if (params.inputAsset) return 'inputAmount';
  if (params.outputAsset) return 'outputAmount';
  return 'inputAmount';
};
export function getSwapsNavigationParams() {
  const params = (Navigation.getActiveRoute().params || {}) as SwapsParams;

  const inputMethod = getInputMethod(params);
  const lastTypedInput = inputMethod === 'slider' ? 'inputAmount' : inputMethod;

  const state = useSwapsStore.getState();
  return {
    inputMethod,
    lastTypedInput,
    focusedInput: lastTypedInput,
    inputAsset: params.inputAsset || state.inputAsset,
    outputAsset: params.outputAsset || state.outputAsset,
    ...params,
  } as const;
}
