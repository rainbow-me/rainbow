import React, { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import { delayNext } from './useMagicAutofocus';
import { AssetType } from '@/entities';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import { updatePrecisionToDisplay } from '@/helpers/utilities';
import { useSwapDerivedValues, useSwapInputHandlers } from '@/hooks';
import { useNavigation } from '@/navigation';
import { emitAssetRequest } from '@/redux/explorer';
import {
  flipSwapCurrencies,
  updateSwapInputAmount,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@/redux/swap';
import Routes from '@/navigation/routesNames';
import { CROSSCHAIN_SWAPS, useExperimentalFlag } from '@/config';

const { currentlyFocusedInput, focusTextInput } = TextInput.State;

export default function useSwapCurrencyHandlers({
  currentNetwork,
  inputNetwork,
  outputNetwork,
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
}: any = {}) {
  const dispatch = useDispatch();
  const crosschainSwapsEnabled = useExperimentalFlag(CROSSCHAIN_SWAPS);
  const {
    navigate,
    setParams,
    getParent: dangerouslyGetParent,
  } = useNavigation();

  const { derivedValues } = useSwapDerivedValues();

  const {
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputHandlers();

  const { defaultInputItemInWallet, defaultOutputItem } = useMemo(() => {
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
            ignoreInitialTypeCheck || crosschainSwapsEnabled
          )
        );
      }
      if (defaultOutputItem) {
        dispatch(
          updateSwapOutputCurrency(
            defaultOutputItem,
            ignoreInitialTypeCheck || crosschainSwapsEnabled
          )
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
    crosschainSwapsEnabled,
  ]);

  const flipSwapCurrenciesWithTimeout = useCallback(
    (
      focusToRef: React.RefObject<any>,
      outputIndependentField = false,
      independentValue: string | null = null
    ) => {
      InteractionManager.runAfterInteractions(() => {
        dispatch(
          flipSwapCurrencies(
            outputIndependentField,
            independentValue ? updatePrecisionToDisplay(independentValue) : null
          )
        );
        setTimeout(() => {
          focusTextInput(focusToRef.current);
        }, 50);
      });
    },
    [dispatch]
  );

  const flipCurrencies = useCallback(() => {
    if (inputNetwork !== outputNetwork) {
      updateOutputAmount(null);
      flipSwapCurrenciesWithTimeout(
        nativeFieldRef.current === currentlyFocusedInput()
          ? nativeFieldRef
          : inputFieldRef,
        false,
        derivedValues?.outputAmount
      );
    } else if (nativeFieldRef.current === currentlyFocusedInput()) {
      updateNativeAmount(null);
      updateInputAmount(null);
      flipSwapCurrenciesWithTimeout(
        outputFieldRef,
        true,
        derivedValues?.inputAmount
      );
    } else if (inputFieldRef.current === currentlyFocusedInput()) {
      updateNativeAmount(null);
      updateInputAmount(null);
      flipSwapCurrenciesWithTimeout(
        outputFieldRef,
        true,
        derivedValues?.inputAmount
      );
    } else if (outputFieldRef.current === currentlyFocusedInput()) {
      updateOutputAmount(null);
      flipSwapCurrenciesWithTimeout(
        inputFieldRef,
        false,
        derivedValues?.outputAmount
      );
    }
  }, [
    currentNetwork,
    inputNetwork,
    outputNetwork,
    nativeFieldRef,
    inputFieldRef,
    outputFieldRef,
    updateOutputAmount,
    flipSwapCurrenciesWithTimeout,
    derivedValues?.outputAmount,
    derivedValues?.inputAmount,
    updateNativeAmount,
    updateInputAmount,
  ]);

  const updateInputCurrency = useCallback(
    (inputCurrency: any, handleNavigate: any) => {
      const newInputCurrency = inputCurrency
        ? {
            ...inputCurrency,
            type: inputCurrency?.type ?? AssetType.token,
          }
        : null;

      dispatch(emitAssetRequest(newInputCurrency.mainnet_address));
      dispatch(
        updateSwapInputCurrency(newInputCurrency, crosschainSwapsEnabled)
      );
      setLastFocusedInputHandle?.(inputFieldRef);
      handleNavigate?.(newInputCurrency);
    },
    [crosschainSwapsEnabled, dispatch, inputFieldRef, setLastFocusedInputHandle]
  );

  const updateOutputCurrency = useCallback(
    (outputCurrency: any, handleNavigate?: (outputCurrency: any) => void) => {
      const newOutputCurrency = outputCurrency
        ? {
            ...outputCurrency,
            type: outputCurrency?.type ?? AssetType.token,
          }
        : null;

      dispatch(emitAssetRequest(newOutputCurrency.mainnet_address));
      dispatch(
        updateSwapOutputCurrency(newOutputCurrency, crosschainSwapsEnabled)
      );
      setLastFocusedInputHandle?.(inputFieldRef);
      handleNavigate?.(newOutputCurrency);
    },
    [crosschainSwapsEnabled, dispatch, inputFieldRef, setLastFocusedInputHandle]
  );

  const navigateToSelectInputCurrency = useCallback(
    (chainId: number) => {
      InteractionManager.runAfterInteractions(() => {
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        dangerouslyGetParent().getState().index = 0;
        setParams({ focused: false });
        delayNext();
        navigate(Routes.CURRENCY_SELECT_SCREEN, {
          callback: inputFieldRef?.current?.clear,
          chainId,
          onSelectCurrency: updateInputCurrency,
          restoreFocusOnSwapModal: () => setParams({ focused: true }),
          title,
          type: CurrencySelectionTypes.input,
        });
      });
    },
    [
      dangerouslyGetParent,
      inputFieldRef,
      navigate,
      setParams,
      title,
      updateInputCurrency,
    ]
  );

  const navigateToSelectOutputCurrency = useCallback(
    (chainId: number) => {
      InteractionManager.runAfterInteractions(() => {
        setParams({ focused: false });
        delayNext();
        navigate(Routes.CURRENCY_SELECT_SCREEN, {
          callback: outputFieldRef?.current?.clear,
          chainId,
          onSelectCurrency: updateOutputCurrency,
          restoreFocusOnSwapModal: () => setParams({ focused: true }),
          title: 'Receive',
          type: CurrencySelectionTypes.output,
        });
      });
    },
    [navigate, outputFieldRef, setParams, updateOutputCurrency]
  );

  const updateAndFocusInputAmount = (value: string) => {
    dispatch(updateSwapInputAmount(updatePrecisionToDisplay(value), true));
    focusTextInput(inputFieldRef);
  };

  return {
    flipCurrencies,
    updateAndFocusInputAmount,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    updateInputCurrency,
    updateOutputCurrency,
  };
}
