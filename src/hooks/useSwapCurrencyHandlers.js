import { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager, Keyboard, TextInput } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { STORAGE_IDS } from '../model/mmkv';
import { delayNext } from './useMagicAutofocus';
import { AssetType } from '@rainbow-me/entities';
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
  Network,
} from '@rainbow-me/helpers';
import { updatePrecisionToDisplay } from '@rainbow-me/helpers/utilities';
import { useSwapCurrencies, useSwapDerivedValues } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
import { emitAssetRequest } from '@rainbow-me/redux/explorer';
import {
  flipSwapCurrencies,
  updateSwapDepositCurrency,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@rainbow-me/redux/swap';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

const storage = new MMKV();
const hasShownWarning = storage.getBoolean(
  STORAGE_IDS.SHOWN_SWAP_RESET_WARNING
);
const setHasShownWarning = () =>
  storage.set(STORAGE_IDS.SHOWN_SWAP_RESET_WARNING, true);

const { currentlyFocusedInput, focusTextInput } = TextInput.State;

export default function useSwapCurrencyHandlers({
  currentNetwork,
  defaultInputAsset,
  defaultOutputAsset,
  fromDiscover,
  ignoreInitialTypeCheck = false,
  inputFieldRef,
  nativeFieldRef,
  outputFieldRef,
  setLastFocusedInputHandle,
  shouldUpdate = true,
  title,
  type,
} = {}) {
  const dispatch = useDispatch();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();

  const { inputCurrency, outputCurrency } = useSwapCurrencies();
  const { derivedValues } = useSwapDerivedValues();

  const { defaultInputItemInWallet, defaultOutputItem } = useMemo(() => {
    if (type === ExchangeModalTypes.withdrawal) {
      return {
        defaultInputItemInWallet: defaultInputAsset,
        defaultOutputItem: null,
      };
    }
    if (type === ExchangeModalTypes.deposit) {
      // if the deposit asset exists in wallet, then set it as default input
      let defaultInputItemInWallet = ethereumUtils.getAccountAsset(
        defaultInputAsset?.address
      );
      let defaultOutputItem = null;

      // if it does not exist, then set it as output
      if (!defaultInputItemInWallet) {
        defaultInputItemInWallet = ethereumUtils.getAccountAsset(ETH_ADDRESS);
        defaultOutputItem = defaultInputAsset;
      }
      dispatch(updateSwapDepositCurrency(defaultInputAsset));
      return {
        defaultInputItemInWallet,
        defaultOutputItem,
      };
    }
    if (type === ExchangeModalTypes.swap) {
      const defaultInputItemInWallet = defaultInputAsset
        ? {
            ...defaultInputAsset,
            type: defaultInputAsset?.type ?? AssetType.token,
          }
        : null;

      return {
        defaultInputItemInWallet,
        defaultOutputItem: defaultOutputAsset ?? null,
      };
    }
    return {
      defaultInputItemInWallet: null,
      defaultOutputItem: null,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (shouldUpdate) {
      if (defaultInputItemInWallet) {
        dispatch(
          updateSwapInputCurrency(
            defaultInputItemInWallet,
            ignoreInitialTypeCheck
          )
        );
      }
      if (defaultOutputItem) {
        dispatch(
          updateSwapOutputCurrency(defaultOutputItem, ignoreInitialTypeCheck)
        );
      }
    }
  }, [
    defaultInputItemInWallet,
    dispatch,
    defaultOutputItem,
    shouldUpdate,
    fromDiscover,
    ignoreInitialTypeCheck,
  ]);

  const flipSwapCurrenciesWithTimeout = useCallback(
    (focusToRef, outputIndependentField = false, independentValue = null) => {
      InteractionManager.runAfterInteractions(() => {
        dispatch(flipSwapCurrencies(outputIndependentField, independentValue));
        setTimeout(() => {
          focusTextInput(focusToRef.current);
        }, 50);
      });
    },
    [dispatch]
  );

  const flipCurrencies = useCallback(() => {
    if (currentNetwork === Network.arbitrum) {
      outputFieldRef.current?.clear();
      inputFieldRef.current?.clear();
      flipSwapCurrenciesWithTimeout(
        nativeFieldRef.current === currentlyFocusedInput()
          ? nativeFieldRef
          : inputFieldRef,
        false,
        updatePrecisionToDisplay(derivedValues?.outputAmount)
      );
    } else if (nativeFieldRef.current === currentlyFocusedInput()) {
      inputFieldRef.current?.clear();
      nativeFieldRef.current?.clear();
      flipSwapCurrenciesWithTimeout(
        outputFieldRef,
        true,
        updatePrecisionToDisplay(derivedValues?.inputAmount)
      );
    } else if (inputFieldRef.current === currentlyFocusedInput()) {
      inputFieldRef.current?.clear();
      nativeFieldRef.current?.clear();
      flipSwapCurrenciesWithTimeout(outputFieldRef, true, null);
    } else if (outputFieldRef.current === currentlyFocusedInput()) {
      outputFieldRef.current?.clear();
      flipSwapCurrenciesWithTimeout(inputFieldRef, false, null);
    }
  }, [
    currentNetwork,
    nativeFieldRef,
    inputFieldRef,
    outputFieldRef,
    flipSwapCurrenciesWithTimeout,
    derivedValues?.outputAmount,
    derivedValues?.inputAmount,
  ]);

  const updateInputCurrency = useCallback(
    (inputCurrency, handleNavigate) => {
      const newInputCurrency = inputCurrency
        ? {
            ...inputCurrency,
            type: inputCurrency?.type ?? AssetType.token,
          }
        : null;

      const updateCurrency = () => {
        dispatch(emitAssetRequest(newInputCurrency.mainnet_address));
        dispatch(updateSwapInputCurrency(newInputCurrency));
        setLastFocusedInputHandle?.(inputFieldRef);
        handleNavigate?.(newInputCurrency);
      };

      if (
        outputCurrency &&
        newInputCurrency?.type !== outputCurrency?.type &&
        !hasShownWarning
      ) {
        android && Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.EXPLAIN_SHEET, {
            network: newInputCurrency?.type
              ? ethereumUtils.getNetworkFromType(newInputCurrency?.type)
              : Network.mainnet,
            onClose: () => {
              InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                  setHasShownWarning();
                  updateCurrency();
                }, 250);
              });
            },
            type: 'swapResetInputs',
          });
        });
      } else {
        updateCurrency();
      }
    },
    [dispatch, inputFieldRef, outputCurrency, setLastFocusedInputHandle]
  );

  const updateOutputCurrency = useCallback(
    (outputCurrency, handleNavigate) => {
      const newOutputCurrency = outputCurrency
        ? {
            ...outputCurrency,
            type: outputCurrency?.type ?? AssetType.token,
          }
        : null;
      const updateCurrency = () => {
        dispatch(emitAssetRequest(newOutputCurrency.mainnet_address));
        dispatch(updateSwapOutputCurrency(newOutputCurrency));
        setLastFocusedInputHandle?.(inputFieldRef);
        handleNavigate?.(newOutputCurrency);
      };
      if (
        inputCurrency &&
        newOutputCurrency?.type !== inputCurrency?.type &&
        !hasShownWarning
      ) {
        android && Keyboard.dismiss();
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.EXPLAIN_SHEET, {
            network: newOutputCurrency?.type
              ? ethereumUtils.getNetworkFromType(newOutputCurrency?.type)
              : Network.mainnet,
            onClose: () => {
              InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                  setHasShownWarning();
                  updateCurrency();
                }, 250);
              });
            },
            type: 'swapResetInputs',
          });
        });
      } else {
        updateCurrency();
      }
    },
    [dispatch, inputCurrency, inputFieldRef, setLastFocusedInputHandle]
  );

  const navigateToSelectInputCurrency = useCallback(
    chainId => {
      InteractionManager.runAfterInteractions(() => {
        dangerouslyGetParent().dangerouslyGetState().index = 0;
        setParams({ focused: false });
        delayNext();
        navigate(Routes.CURRENCY_SELECT_SCREEN, {
          chainId,
          onSelectCurrency: updateInputCurrency,
          restoreFocusOnSwapModal: () => setParams({ focused: true }),
          title,
          type: CurrencySelectionTypes.input,
        });
      });
    },
    [dangerouslyGetParent, navigate, setParams, title, updateInputCurrency]
  );

  const navigateToSelectOutputCurrency = useCallback(
    chainId => {
      InteractionManager.runAfterInteractions(() => {
        setParams({ focused: false });
        navigate(Routes.CURRENCY_SELECT_SCREEN, {
          chainId,
          onSelectCurrency: updateOutputCurrency,
          restoreFocusOnSwapModal: () => setParams({ focused: true }),
          title: 'Receive',
          type: CurrencySelectionTypes.output,
        });
      });
    },
    [navigate, setParams, updateOutputCurrency]
  );

  return {
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    updateInputCurrency,
    updateOutputCurrency,
  };
}
