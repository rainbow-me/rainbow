import { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import { delayNext } from './useMagicAutofocus';
import { AssetType } from '@/entities';
import { CurrencySelectionTypes, ExchangeModalTypes, Network } from '@/helpers';
import { updatePrecisionToDisplay } from '@/helpers/utilities';
import { useSwapDerivedValues, useSwapInputHandlers } from '@/hooks';
import { useNavigation } from '@/navigation';
import { emitAssetRequest } from '@/redux/explorer';
import {
  flipSwapCurrencies,
  updateSwapDepositCurrency,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@/redux/swap';
import { ETH_ADDRESS } from '@/references';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';

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
}: any = {}) {
  const dispatch = useDispatch();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();

  const { derivedValues } = useSwapDerivedValues();

  const {
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputHandlers();

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
    if (currentNetwork === Network.arbitrum) {
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
    nativeFieldRef,
    inputFieldRef,
    outputFieldRef,
    updateOutputAmount,
    updateInputAmount,
    flipSwapCurrenciesWithTimeout,
    derivedValues?.outputAmount,
    derivedValues?.inputAmount,
    updateNativeAmount,
  ]);

  const updateInputCurrency = useCallback(
    (inputCurrency, handleNavigate) => {
      const newInputCurrency = inputCurrency
        ? {
            ...inputCurrency,
            type: inputCurrency?.type ?? AssetType.token,
          }
        : null;

      dispatch(emitAssetRequest(newInputCurrency.mainnet_address));
      dispatch(updateSwapInputCurrency(newInputCurrency));
      setLastFocusedInputHandle?.(inputFieldRef);
      handleNavigate?.(newInputCurrency);
    },
    [dispatch, inputFieldRef, setLastFocusedInputHandle]
  );

  const updateOutputCurrency = useCallback(
    (outputCurrency, handleNavigate) => {
      const newOutputCurrency = outputCurrency
        ? {
            ...outputCurrency,
            type: outputCurrency?.type ?? AssetType.token,
          }
        : null;

      dispatch(emitAssetRequest(newOutputCurrency.mainnet_address));
      dispatch(updateSwapOutputCurrency(newOutputCurrency));
      setLastFocusedInputHandle?.(inputFieldRef);
      handleNavigate?.(newOutputCurrency);
    },
    [dispatch, inputFieldRef, setLastFocusedInputHandle]
  );

  const navigateToSelectInputCurrency = useCallback(
    chainId => {
      InteractionManager.runAfterInteractions(() => {
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        dangerouslyGetParent().dangerouslyGetState().index = 0;
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
    chainId => {
      InteractionManager.runAfterInteractions(() => {
        setParams({ focused: false });
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

  return {
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    updateInputCurrency,
    updateOutputCurrency,
  };
}
