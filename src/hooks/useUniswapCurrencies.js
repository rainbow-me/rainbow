import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import { delayNext } from './useMagicAutofocus';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useUniswapCalls from './useUniswapCalls';
import { CurrencySelectionTypes } from '@rainbow-me/helpers';
import { useNavigation } from '@rainbow-me/navigation';
import {
  multicallAddListeners,
  multicallUpdateOutdatedListeners,
} from '@rainbow-me/redux/multicall';
import {
  flipSwapCurrencies,
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@rainbow-me/redux/swap';
import Routes from '@rainbow-me/routes';
import { multiply } from '@rainbow-me/utilities';
import { ethereumUtils, isNewValueForPath } from '@rainbow-me/utils';
import logger from 'logger';

const isSameAsset = (newInputCurrency, previousInputCurrency) =>
  !isNewValueForPath(newInputCurrency, previousInputCurrency, 'address');

const createMissingAsset = (asset, underlyingPrice, priceOfEther) => {
  const { address, decimals, name, symbol } = asset;
  const priceInUSD = multiply(priceOfEther, underlyingPrice);

  return {
    address,
    decimals,
    name,
    native: {
      price: {
        amount: priceInUSD,
        display: '',
      },
    },
    price: {
      value: priceInUSD,
    },
    symbol,
    uniqueId: address,
  };
};

export default function useUniswapCurrencies({
  defaultInputAsset,
  isDeposit,
  isWithdrawal,
  title,
  type,
  underlyingPrice,
}) {
  const dispatch = useDispatch();
  const { allAssets } = useAccountAssets();
  const { chainId } = useAccountSettings();
  const { navigate, setParams, dangerouslyGetParent } = useNavigation();
  const {
    params: { blockInteractions },
  } = useRoute();

  const defaultInputAddress = defaultInputAsset?.address;
  const {
    defaultChosenInputItem,
    defaultInputItemInWallet,
    defaultOutputItem,
  } = useMemo(() => {
    let defaultInputItemInWallet = ethereumUtils.getAsset(
      allAssets,
      defaultInputAddress
    );

    // Only used for withdrawals
    let defaultChosenInputItem = defaultInputItemInWallet;

    // If default input asset not found in wallet, create the missing asset
    if (!defaultChosenInputItem && defaultInputAsset) {
      const priceOfEther = ethereumUtils.getEthPriceUnit();

      defaultChosenInputItem = createMissingAsset(
        defaultInputAsset,
        underlyingPrice,
        priceOfEther
      );
    }

    // If default input asset not found in wallet and it is withdrawal
    // Set the defaultInputItemInWallet to the created item
    if (!defaultInputItemInWallet && isWithdrawal) {
      defaultInputItemInWallet = defaultChosenInputItem;
    } else if (!defaultInputItemInWallet) {
      // If there is not default input item, set the default to ETH
      defaultInputItemInWallet = ethereumUtils.getAsset(allAssets);
    }

    let defaultOutputItem = null;

    // If it is a deposit and the asset in the wallet is not the same as the defult input asset,
    // set the output
    if (
      isDeposit &&
      defaultInputItemInWallet?.address !== defaultInputAddress
    ) {
      defaultOutputItem = defaultChosenInputItem;
    }
    return {
      defaultChosenInputItem,
      defaultInputItemInWallet,
      defaultOutputItem,
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    dispatch(updateSwapInputCurrency(defaultInputItemInWallet));
    dispatch(updateSwapOutputCurrency(defaultOutputItem));
  }, [defaultInputItemInWallet, dispatch, defaultOutputItem]);

  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();

  const { calls } = useUniswapCalls();

  useEffect(() => {
    if (!inputCurrency || !outputCurrency || isEmpty(calls)) return;
    dispatch(multicallAddListeners({ calls, chainId }));
    dispatch(multicallUpdateOutdatedListeners());
  }, [calls, chainId, dispatch, inputCurrency, outputCurrency]);

  const flipCurrencies = useCallback(() => {
    dispatch(flipSwapCurrencies());
  }, [dispatch]);

  const updateInputCurrency = useCallback(
    newInputCurrency => {
      logger.log('[update input curr] new input curr', newInputCurrency);
      logger.log('[update input curr] prev input curr', inputCurrency);

      if (isSameAsset(newInputCurrency, outputCurrency)) {
        logger.log(
          '[update input curr] setting output curr to prev input curr'
        );
        if (isDeposit || isWithdrawal) {
          dispatch(updateSwapOutputCurrency(null));
        } else {
          dispatch(flipSwapCurrencies());
        }
      } else {
        dispatch(updateSwapInputCurrency(newInputCurrency));
      }

      if (isDeposit && newInputCurrency?.address !== defaultInputAddress) {
        logger.log(
          '[update input curr] new deposit output for deposit',
          defaultChosenInputItem
        );
        dispatch(updateSwapOutputCurrency(defaultChosenInputItem));
      }

      analytics.track('Switched input asset', {
        defaultInputAsset: defaultInputAsset?.symbol,
        from: inputCurrency?.symbol,
        label: newInputCurrency?.symbol,
        type,
      });
    },
    [
      defaultChosenInputItem,
      defaultInputAddress,
      defaultInputAsset,
      dispatch,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      outputCurrency,
      type,
    ]
  );

  const updateOutputCurrency = useCallback(
    newOutputCurrency => {
      logger.log('[update output curr] new output curr', newOutputCurrency);

      logger.log('[update output curr] prev output curr', outputCurrency);

      if (isSameAsset(inputCurrency, newOutputCurrency)) {
        logger.log(
          '[update output curr] updating input curr with prev output curr'
        );
        dispatch(flipSwapCurrencies());
      } else {
        dispatch(updateSwapOutputCurrency(newOutputCurrency));
      }

      analytics.track('Switched output asset', {
        defaultInputAsset: defaultInputAsset?.symbol,
        from: outputCurrency?.symbol,
        label: newOutputCurrency?.symbol,
        type,
      });
    },
    [defaultInputAsset, dispatch, inputCurrency, outputCurrency, type]
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
