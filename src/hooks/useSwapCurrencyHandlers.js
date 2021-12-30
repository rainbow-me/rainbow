import { useRoute } from '@react-navigation/native';
import { useCallback, useLayoutEffect, useMemo } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import { delayNext } from './useMagicAutofocus';
import useTimeout from './useTimeout';
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
} from '@rainbow-me/helpers';
import { useNavigation } from '@rainbow-me/navigation';
import {
  flipSwapCurrencies,
  updateSwapDepositCurrency,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@rainbow-me/redux/swap';
import { ETH_ADDRESS } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { ethereumUtils } from '@rainbow-me/utils';

const { currentlyFocusedInput, focusTextInput } = TextInput.State;

export default function useSwapCurrencyHandlers({
  defaultInputAsset,
  defaultOutputAsset,
  inputFieldRef,
  setLastFocusedInputHandle,
  outputFieldRef,
  title,
  type,
}) {
  const dispatch = useDispatch();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();
  const {
    params: { blockInteractions },
  } = useRoute();

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
      return {
        defaultInputItemInWallet:
          defaultInputAsset ?? ethereumUtils.getAccountAsset(ETH_ADDRESS),
        defaultOutputItem: defaultOutputAsset ?? null,
      };
    }
    return {
      defaultInputItemInWallet: null,
      defaultOutputItem: null,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    dispatch(updateSwapInputCurrency(defaultInputItemInWallet));
    dispatch(updateSwapOutputCurrency(defaultOutputItem));
  }, [defaultInputItemInWallet, dispatch, defaultOutputItem]);

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
    newInputCurrency => {
      dispatch(updateSwapInputCurrency(newInputCurrency));
      setLastFocusedInputHandle(inputFieldRef);
    },
    [dispatch, inputFieldRef, setLastFocusedInputHandle]
  );

  const updateOutputCurrency = useCallback(
    newOutputCurrency => {
      dispatch(updateSwapOutputCurrency(newOutputCurrency));
      setLastFocusedInputHandle(outputFieldRef);
    },
    [dispatch, outputFieldRef, setLastFocusedInputHandle]
  );

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      dangerouslyGetParent().dangerouslyGetState().index = 0;
      setParams({ focused: false });
      delayNext();
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        onSelectCurrency: updateInputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
        title,
        type: CurrencySelectionTypes.input,
      });
      blockInteractions();
    });
  }, [
    blockInteractions,
    dangerouslyGetParent,
    navigate,
    setParams,
    title,
    updateInputCurrency,
  ]);

  const navigateToSelectOutputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setParams({ focused: false });
      dangerouslyGetParent().dangerouslyGetState().index = 0;
      delayNext();
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
        title: 'Receive',
        type: CurrencySelectionTypes.output,
      });
      blockInteractions();
    });
  }, [
    blockInteractions,
    dangerouslyGetParent,
    navigate,
    setParams,
    updateOutputCurrency,
  ]);

  return {
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    updateInputCurrency,
    updateOutputCurrency,
  };
}
