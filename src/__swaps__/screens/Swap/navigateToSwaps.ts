import { GasSpeed } from '@/__swaps__/types/gas';
import { getDefaultSlippage, slippageInBipsToString } from '@/__swaps__/utils/swaps';
import { enableActionsOnReadOnlyWallet } from '@/config';
import { getRemoteConfig } from '@/model/remoteConfig';
import { Navigation } from '@/navigation';
import Routes from '@/navigation/routesNames';
import store from '@/redux/store';
import { ChainId } from '@/state/backendNetworks/types';
import { SwapsState, useSwapsStore } from '@/state/swaps/swapsStore';
import { getIsReadOnlyWallet } from '@/state/wallets/wallets';
import { watchingAlert } from '@/utils';
import { setSelectedGasSpeed } from './hooks/useSele∏tedGas';

export type SwapsParams = Partial<
  Pick<SwapsState, 'inputAsset' | 'outputAsset' | 'percentageToSell' | 'slippage'> & {
    inputAmount: string;
    outputAmount: string;
    gasSpeed: GasSpeed;
  }
>;

export async function navigateToSwaps({ gasSpeed, ...params }: SwapsParams) {
  if (!enableActionsOnReadOnlyWallet && getIsReadOnlyWallet()) {
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
  const { inputAsset: fallbackInputAsset, outputAsset: fallbackOutputAsset, setSlippage } = useSwapsStore.getState();
  const params = (Navigation.getActiveRoute()?.params || {}) as SwapsParams;

  const inputMethod = getInputMethod(params);
  const inputAsset = params.inputAsset || fallbackInputAsset;
  const outputAsset = params.outputAsset || fallbackOutputAsset;
  const chainId = inputAsset?.chainId || ChainId.mainnet;
  const lastTypedInput = inputMethod === 'slider' ? 'inputAmount' : inputMethod;
  const slippage =
    params.slippage && !isNaN(+params.slippage) ? slippageInBipsToString(+params.slippage) : getDefaultSlippage(chainId, getRemoteConfig());

  // Set the slippage in the swaps store to keep it in sync with the initial value
  setSlippage(slippage);

  return {
    inputMethod,
    lastTypedInput,
    focusedInput: lastTypedInput,
    inputAsset,
    outputAsset,
    slippage,
    ...params,
  } as const;
}
