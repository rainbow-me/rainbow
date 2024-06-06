import { TransactionGasParamAmounts, LegacyTransactionGasParamAmounts } from '@/entities';
import { getFlashbotsProvider, getCachedProviderForNetwork, isHardHat } from '@/handlers/web3';
import { RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { getNetworkObj } from '@/networks';
import { walletExecuteRap } from '@/raps/execute';
import { RapSwapActionParameters } from '@/raps/references';
import { queryClient } from '@/react-query';
import { userAssetsQueryKey } from '@/resources/assets/UserAssetsQuery';
import { ethereumUtils, logger } from '@/utils';
import { NativeModules, Alert } from 'react-native';
import { SharedValue, runOnUI } from 'react-native-reanimated';
import { getSelectedGas, getGasSettingsBySpeed } from '../hooks/useSelectedGas';
import * as i18n from '@/languages';
import { useSwapInputsController } from '../hooks/useSwapInputsController';
import { SupportedCurrencyKey } from '@/references';
import Routes from '@/navigation/routesNames';

export const getNonceAndPerformSwap = async ({
  type,
  parameters,
  isSwapping,
  SwapInputController,
  nativeCurrency,
}: {
  type: 'swap' | 'crosschainSwap';
  parameters: Omit<RapSwapActionParameters<typeof type>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'>;
  isSwapping: SharedValue<boolean>;
  SwapInputController: ReturnType<typeof useSwapInputsController>;
  nativeCurrency: SupportedCurrencyKey;
}) => {
  const NotificationManager = ios ? NativeModules.NotificationManager : null;
  NotificationManager?.postNotification('rapInProgress');

  const resetSwappingStatus = () => {
    'worklet';
    isSwapping.value = false;
  };

  const network = ethereumUtils.getNetworkFromChainId(parameters.chainId);
  const provider =
    parameters.flashbots && getNetworkObj(network).features.flashbots ? await getFlashbotsProvider() : getCachedProviderForNetwork(network);
  const providerUrl = provider?.connection?.url;
  const connectedToHardhat = isHardHat(providerUrl);

  const selectedGas = getSelectedGas(parameters.chainId);
  if (!selectedGas) {
    runOnUI(resetSwappingStatus)();
    Alert.alert(i18n.t(i18n.l.gas.unable_to_determine_selected_gas));
    return;
  }

  const wallet = await loadWallet(parameters.quote.from, false, provider);
  if (!wallet) {
    runOnUI(resetSwappingStatus)();
    Alert.alert(i18n.t(i18n.l.swap.unable_to_load_wallet));
    return;
  }

  const gasFeeParamsBySpeed = getGasSettingsBySpeed(parameters.chainId);

  let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts = {} as
    | TransactionGasParamAmounts
    | LegacyTransactionGasParamAmounts;

  if (selectedGas.isEIP1559) {
    gasParams = {
      maxFeePerGas: selectedGas.maxBaseFee,
      maxPriorityFeePerGas: selectedGas.maxPriorityFee,
    };
  } else {
    gasParams = {
      gasPrice: selectedGas.gasPrice,
    };
  }

  const { errorMessage } = await walletExecuteRap(wallet, type, {
    ...parameters,
    gasParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gasFeeParamsBySpeed: gasFeeParamsBySpeed as any,
  });
  runOnUI(resetSwappingStatus)();

  if (errorMessage) {
    SwapInputController.quoteFetchingInterval.start();

    if (errorMessage !== 'handled') {
      logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
      const extractedError = errorMessage.split('[')[0];
      Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
      return;
    }
  }

  queryClient.invalidateQueries({
    queryKey: userAssetsQueryKey({
      address: parameters.quote.from as `0x${string}`,
      currency: nativeCurrency,
      connectedToHardhat,
    }),
  });

  // TODO: Analytics
  NotificationManager?.postNotification('rapCompleted');
  Navigation.handleAction(Routes.PROFILE_SCREEN, {});
};
