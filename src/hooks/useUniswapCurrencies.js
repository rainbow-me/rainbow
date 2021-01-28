/* eslint-disable no-use-before-define */
import { useRoute } from '@react-navigation/native';
import analytics from '@segment/analytics-react-native';
import { find, get, isEmpty } from 'lodash';
import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';

import { useNavigation } from '../navigation/Navigation';
import useAccountAssets from './useAccountAssets';
import useAccountSettings from './useAccountSettings';
import { delayNext } from './useMagicAutofocus';
import usePrevious from './usePrevious';
import useSwapInputOutputTokens from './useSwapInputOutputTokens';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
import useUniswapCalls from './useUniswapCalls';
import CurrencySelectionTypes from '@rainbow-me/helpers/currencySelectionTypes';
import { multiply } from '@rainbow-me/utilities';
import {
  multicallAddListeners,
  multicallUpdateOutdatedListeners,
} from '@rainbow-me/redux/multicall';
import {
  updateSwapInputCurrency,
  updateSwapOutputCurrency,
} from '@rainbow-me/redux/swap';
import Routes from '@rainbow-me/routes';
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
  inputHeaderTitle,
  isDeposit,
  isWithdrawal,
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

  const defaultInputAddress = get(defaultInputAsset, 'address');
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
      get(defaultInputItemInWallet, 'address') !== defaultInputAddress
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

  const previousInputCurrency = usePrevious(inputCurrency);
  const previousOutputCurrency = usePrevious(outputCurrency);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();

  useEffect(() => {
    if (!inputCurrency || !outputCurrency || isEmpty(calls)) return;
    if (
      isSameAsset(inputCurrency, previousInputCurrency) &&
      isSameAsset(outputCurrency, previousOutputCurrency)
    )
      return;

    dispatch(multicallAddListeners({ calls, chainId }));
    dispatch(multicallUpdateOutdatedListeners());
  }, [
    calls,
    chainId,
    dispatch,
    inputCurrency,
    outputCurrency,
    previousInputCurrency,
    previousOutputCurrency,
  ]);

  const updateInputCurrency = useCallback(
    async (newInputCurrency, userSelected = true) => {
      logger.log(
        '[update input curr] new input curr, user selected?',
        newInputCurrency,
        userSelected
      );

      logger.log('[update input curr] prev input curr', previousInputCurrency);

      dispatch(updateSwapInputCurrency(newInputCurrency));

      if (userSelected && isSameAsset(newInputCurrency, outputCurrency)) {
        logger.log(
          '[update input curr] setting output curr to prev input curr'
        );
        if (isDeposit || isWithdrawal) {
          updateOutputCurrency(null, false);
        } else {
          updateOutputCurrency(previousInputCurrency, false);
        }
      }

      if (
        isDeposit &&
        get(newInputCurrency, 'address') !== defaultInputAddress
      ) {
        logger.log(
          '[update input curr] new deposit output for deposit',
          defaultChosenInputItem
        );
        updateOutputCurrency(defaultChosenInputItem, false);
      }

      analytics.track('Switched input asset', {
        defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
        from: get(previousInputCurrency, 'symbol', ''),
        label: get(newInputCurrency, 'symbol', ''),
        type,
      });
    },
    [
      defaultChosenInputItem,
      defaultInputAddress,
      defaultInputAsset,
      dispatch,
      isDeposit,
      isWithdrawal,
      outputCurrency,
      previousInputCurrency,
      type,
      updateOutputCurrency,
    ]
  );

  const updateOutputCurrency = useCallback(
    (newOutputCurrency, userSelected = true) => {
      logger.log(
        '[update output curr] new output curr, user selected?',
        newOutputCurrency,
        userSelected
      );
      logger.log(
        '[update output curr] input currency at the moment',
        inputCurrency
      );

      dispatch(updateSwapOutputCurrency(newOutputCurrency));

      logger.log(
        '[update output curr] prev output curr',
        previousOutputCurrency
      );
      const existsInWallet = find(
        uniswapAssetsInWallet,
        asset =>
          get(asset, 'address') === get(previousOutputCurrency, 'address')
      );
      if (userSelected && isSameAsset(inputCurrency, newOutputCurrency)) {
        if (existsInWallet) {
          logger.log(
            '[update output curr] updating input curr with prev output curr'
          );
          updateInputCurrency(existsInWallet, false);
        } else {
          logger.log('[update output curr] updating input curr with nothing');
          updateInputCurrency(null, false);
        }
      }

      analytics.track('Switched output asset', {
        defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
        from: get(previousOutputCurrency, 'symbol', ''),
        label: get(newOutputCurrency, 'symbol', ''),
        type,
      });
    },
    [
      defaultInputAsset,
      dispatch,
      inputCurrency,
      previousOutputCurrency,
      type,
      uniswapAssetsInWallet,
      updateInputCurrency,
    ]
  );

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      dangerouslyGetParent().dangerouslyGetState().index = 0;
      setParams({ focused: false });
      delayNext();
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        headerTitle: inputHeaderTitle,
        onSelectCurrency: updateInputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
        type: CurrencySelectionTypes.input,
      });
      blockInteractions();
    });
  }, [
    blockInteractions,
    dangerouslyGetParent,
    inputHeaderTitle,
    navigate,
    setParams,
    updateInputCurrency,
  ]);

  const navigateToSelectOutputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setParams({ focused: false });
      dangerouslyGetParent().dangerouslyGetState().index = 0;
      delayNext();
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        headerTitle: 'Receive',
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
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
    defaultInputAddress,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    previousInputCurrency,
  };
}
