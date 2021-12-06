import { useRoute } from '@react-navigation/native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { InteractionManager, TextInput } from 'react-native';
import { useDispatch } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import { delayNext } from './useMagicAutofocus';
import useSwapCurrencies from './useSwapCurrencies';
import useTimeout from './useTimeout';
import useUniswapCalls from './useUniswapCalls';
import {
  CurrencySelectionTypes,
  ExchangeModalTypes,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
} from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
import {
  multicallAddListeners,
  multicallUpdateOutdatedListeners,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/multicall' o... Remove this comment to see the full error message
} from '@rainbow-me/redux/multicall';
import {
  flipSwapCurrencies,
  updateSwapDepositCurrency,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
} from '@rainbow-me/redux/swap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
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
}: any) {
  const dispatch = useDispatch();
  const { allAssets } = useAccountAssets();
  const { chainId } = useAccountSettings();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();
  const {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'blockInteractions' does not exist on typ... Remove this comment to see the full error message
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
      let defaultInputItemInWallet = ethereumUtils.getAsset(
        allAssets,
        defaultInputAsset?.address
      );
      let defaultOutputItem = null;

      // if it does not exist, then set it as output
      if (!defaultInputItemInWallet) {
        defaultInputItemInWallet = ethereumUtils.getAsset(allAssets);
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
          defaultInputAsset ?? ethereumUtils.getAsset(allAssets),
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

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const { calls } = useUniswapCalls();

  useEffect(() => {
    if (!inputCurrency || !outputCurrency || isEmpty(calls)) return;
    dispatch(multicallAddListeners({ calls, chainId }));
    dispatch(multicallUpdateOutdatedListeners());
  }, [calls, chainId, dispatch, inputCurrency, outputCurrency]);

  const [startFlipFocusTimeout] = useTimeout();
  const flipCurrencies = useCallback(() => {
    dispatch(flipSwapCurrencies());
    // @ts-expect-error ts-migrate(2349) FIXME: This expression is not callable.
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
