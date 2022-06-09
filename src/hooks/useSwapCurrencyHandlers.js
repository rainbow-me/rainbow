import { useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { useDispatch } from 'react-redux';
import { STORAGE_IDS } from '../model/mmkv';
import { delayNext } from './useMagicAutofocus';
import useTimeout from './useTimeout';
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
  Network,
} from '@rainbow-me/helpers';
import { useSwapCurrencies } from '@rainbow-me/hooks';
import { Navigation, useNavigation } from '@rainbow-me/navigation';
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
  defaultInputAsset,
  defaultOutputAsset,
  fromDiscover,
  ignoreInitialTypeCheck = false,
  inputFieldRef,
  setLastFocusedInputHandle,
  outputFieldRef,
  shouldUpdate = true,
  title,
  type,
} = {}) {
  const dispatch = useDispatch();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();
  const { params: { blockInteractions } = {} } = useRoute();

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

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
            type: ethereumUtils.getNetworkFromType(defaultInputAsset?.type),
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
      dispatch(updateSwapInputCurrency(defaultInputItemInWallet));

      /**
       * Note: `ignoreInitialTypeCheck` is truthy when the user comes from the "Get {currency}" swap button flow.
       * In this flow, we prepopulate the output currency, but we also do not want to clear the selected input
       * currency.
       */
      dispatch(
        updateSwapOutputCurrency(defaultOutputItem, ignoreInitialTypeCheck)
      );
    }
  }, [
    defaultInputItemInWallet,
    dispatch,
    defaultOutputItem,
    shouldUpdate,
    fromDiscover,
    ignoreInitialTypeCheck,
  ]);

  const [startFlipFocusTimeout] = useTimeout();
  const flipCurrencies = useCallback(() => {
    dispatch(flipSwapCurrencies());
    startFlipFocusTimeout(() => {
      if (inputFieldRef.current === currentlyFocusedInput()) {
        focusTextInput(outputFieldRef.current);
      } else if (outputFieldRef.current === currentlyFocusedInput()) {
        focusTextInput(inputFieldRef.current);
      }
    }, 50);
  }, [dispatch, inputFieldRef, outputFieldRef, startFlipFocusTimeout]);

  const updateInputCurrency = useCallback(
    (inputCurrency, handleNavigate) => {
      const newInputCurrency = inputCurrency
        ? {
            ...inputCurrency,
            type: ethereumUtils.getNetworkFromType(inputCurrency?.type),
          }
        : null;
      if (
        !fromDiscover &&
        !inputCurrency &&
        outputCurrency?.implementations?.[newInputCurrency?.type]?.address
      ) {
        let newOutputCurrency = outputCurrency;
        if (newInputCurrency.type !== Network.mainnet)
          newOutputCurrency.mainnet_address = outputCurrency.address;

        newOutputCurrency.address =
          outputCurrency.implementations[newInputCurrency?.type].address;
        newOutputCurrency.type = newInputCurrency.type;
        newOutputCurrency.uniqueId =
          newInputCurrency.type === Network.mainnet
            ? newOutputCurrency?.address
            : `${newOutputCurrency?.address}_${newOutputCurrency?.type}`;
        dispatch(updateSwapInputCurrency(newInputCurrency, true));
        dispatch(updateSwapOutputCurrency(newOutputCurrency));
        setLastFocusedInputHandle?.(inputFieldRef);
        handleNavigate();
      } else if (
        outputCurrency &&
        newInputCurrency?.type !== outputCurrency?.type &&
        !hasShownWarning
      ) {
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.EXPLAIN_SHEET, {
            network: newInputCurrency?.type,
            onClose: () => {
              InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                  setHasShownWarning();
                  dispatch(updateSwapInputCurrency(newInputCurrency));
                  setLastFocusedInputHandle?.(inputFieldRef);
                  handleNavigate();
                }, 250);
              });
            },
            type: 'swapResetInputs',
          });
        });
      } else {
        dispatch(updateSwapInputCurrency(newInputCurrency));
        setLastFocusedInputHandle?.(inputFieldRef);
        handleNavigate();
      }
    },
    [
      dispatch,
      fromDiscover,
      inputFieldRef,
      outputCurrency,
      setLastFocusedInputHandle,
    ]
  );

  const updateOutputCurrency = useCallback(
    (outputCurrency, handleNavigate) => {
      const newOutputCurrency = outputCurrency
        ? {
            ...outputCurrency,
            type: ethereumUtils.getNetworkFromType(outputCurrency?.type),
          }
        : null;
      if (
        inputCurrency &&
        newOutputCurrency?.type !== inputCurrency?.type &&
        !hasShownWarning
      ) {
        InteractionManager.runAfterInteractions(() => {
          Navigation.handleAction(Routes.EXPLAIN_SHEET, {
            network: newOutputCurrency?.type,
            onClose: () => {
              InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                  setHasShownWarning();
                  dispatch(updateSwapOutputCurrency(newOutputCurrency));
                  setLastFocusedInputHandle?.(inputFieldRef);
                  handleNavigate();
                }, 250);
              });
            },
            type: 'swapResetInputs',
          });
        });
      } else {
        dispatch(updateSwapOutputCurrency(newOutputCurrency));
        setLastFocusedInputHandle?.(inputFieldRef);
        handleNavigate();
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
        blockInteractions();
      });
    },
    [
      blockInteractions,
      dangerouslyGetParent,
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
