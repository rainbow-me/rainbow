import { useCallback } from 'react';
import { Alert } from 'react-native';
import { triggerHaptics } from 'react-native-turbo-haptics';
import { trackSwapEvent } from '@/__swaps__/utils/trackSwapEvent';
import { analytics } from '@/analytics';
import { LegacyTransactionGasParamAmounts, TransactionGasParamAmounts } from '@/entities';
import { USDC_ASSET } from '@/features/perps/constants';
import { PerpsDepositContextType } from '@/features/perps/screens/perps-deposit-withdraw-screen/types';
import { LedgerSigner } from '@/handlers/LedgerSigner';
import { getProvider } from '@/handlers/web3';
import * as i18n from '@/languages';
import { logger, RainbowError } from '@/logger';
import { loadWallet } from '@/model/wallet';
import { Navigation } from '@/navigation';
import { walletExecuteRap } from '@/raps/execute';
import { RapSwapActionParameters, rapTypes } from '@/raps/references';
import { sumWorklet } from '@/safe-math/SafeMath';
import { getNextNonce } from '@/state/nonces';
import { executeFn, Screens, TimeToSignOperation } from '@/state/performance/performance';
import { isValidQuote } from '@/features/perps/screens/perps-deposit-withdraw-screen/utils';

export function usePerpsDepositHandler({
  depositActions,
  gasStores,
  quoteActions,
  isSubmitting,
}: Pick<PerpsDepositContextType, 'depositActions' | 'gasStores' | 'quoteActions' | 'isSubmitting'>) {
  return useCallback(async () => {
    const asset = depositActions.getAsset();
    const gasFeeParamsBySpeed = gasStores.useMeteorologyStore.getState().getGasSuggestions();
    const gasSettings = gasStores.useGasSettings.getState();
    const quote = quoteActions.getData();

    if (!isValidQuote(quote) || !asset || !gasFeeParamsBySpeed || !gasSettings || isSubmitting.value) return;

    const isSubmittingSharedValue = isSubmitting;
    isSubmittingSharedValue.value = true;

    const parameters: Omit<RapSwapActionParameters<rapTypes.crosschainSwap>, 'gasParams' | 'gasFeeParamsBySpeed' | 'selectedGasFee'> = {
      assetToBuy: USDC_ASSET,
      assetToSell: asset,
      buyAmount: quote.buyAmount?.toString(),
      chainId: asset.chainId,
      quote,
      sellAmount: quote.sellAmount?.toString(),
    };

    try {
      const provider = getProvider({ chainId: asset.chainId });

      const wallet = await executeFn(loadWallet, {
        operation: TimeToSignOperation.KeychainRead,
        screen: Screens.PERPS_DEPOSIT,
      })({
        address: quote.from,
        provider,
        showErrorIfNotLoaded: false,
        timeTracking: {
          operation: TimeToSignOperation.Authentication,
          screen: Screens.PERPS_DEPOSIT,
        },
      });
      const isHardwareWallet = wallet instanceof LedgerSigner;

      if (!wallet) {
        triggerHaptics('notificationError');
        return;
      }

      if (!gasSettings) return;

      let gasParams: TransactionGasParamAmounts | LegacyTransactionGasParamAmounts;

      if (gasSettings.isEIP1559) {
        gasParams = {
          maxFeePerGas: sumWorklet(gasSettings.maxBaseFee, gasSettings.maxPriorityFee),
          maxPriorityFeePerGas: gasSettings.maxPriorityFee,
        };
      } else {
        gasParams = { gasPrice: gasSettings.gasPrice };
      }

      const nonce = await getNextNonce({ address: quote.from, chainId: asset.chainId });

      const { errorMessage } = await executeFn(walletExecuteRap, {
        operation: TimeToSignOperation.SignTransaction,
        screen: Screens.PERPS_DEPOSIT,
      })(wallet, rapTypes.crosschainSwap, {
        ...parameters,
        chainId: asset.chainId,
        gasFeeParamsBySpeed,
        gasParams,
        nonce,
      });

      if (errorMessage) {
        trackSwapEvent(analytics.event.swapsFailed, {
          errorMessage,
          isHardwareWallet,
          parameters,
          type: rapTypes.crosschainSwap,
        });

        if (errorMessage !== 'handled') {
          logger.error(new RainbowError(`[getNonceAndPerformSwap]: Error executing swap: ${errorMessage}`));
          const extractedError = errorMessage.split('[')[0];
          Alert.alert(i18n.t(i18n.l.swap.error_executing_swap), extractedError);
          return;
        }
      }

      executeFn(Navigation.goBack, {
        endOfOperation: true,
        operation: TimeToSignOperation.SheetDismissal,
        screen: Screens.PERPS_DEPOSIT,
      })();

      trackSwapEvent(analytics.event.swapsSubmitted, {
        isHardwareWallet,
        parameters,
        type: rapTypes.crosschainSwap,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while processing perps deposit';
      logger.error(new RainbowError(`[useHandlePerpsDeposit]: ${message}`), {
        data: { error, parameters, type: rapTypes.crosschainSwap },
      });
    } finally {
      isSubmittingSharedValue.value = false;
    }
  }, [depositActions, gasStores, isSubmitting, quoteActions]);
}
