/* eslint-disable no-use-before-define */
import analytics from '@segment/analytics-react-native';
import { find, get } from 'lodash';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { InteractionManager } from 'react-native';
import CurrencySelectionTypes from '../helpers/currencySelectionTypes';
import { multiply } from '../helpers/utilities';
import { useNavigation } from '../navigation/Navigation';
import useAccountAssets from './useAccountAssets';
import usePrevious from './usePrevious';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
import useUniswapCurrencyReserves from './useUniswapCurrencyReserves';
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
  category,
  defaultInputAsset,
  inputHeaderTitle,
  isDeposit,
  isWithdrawal,
  type,
  underlyingPrice,
}) {
  const { allAssets } = useAccountAssets();
  const { navigate, setParams } = useNavigation();

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
      const eth = ethereumUtils.getAsset(allAssets);
      const priceOfEther = get(eth, 'native.price.amount', null);
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
  }, [
    allAssets,
    defaultInputAddress,
    defaultInputAsset,
    isDeposit,
    isWithdrawal,
    underlyingPrice,
  ]);

  const [inputCurrency, setInputCurrency] = useState(defaultInputItemInWallet);
  const [outputCurrency, setOutputCurrency] = useState(defaultOutputItem);

  const prevDefaultOutputItem = usePrevious(defaultOutputItem);
  const prevDefaultInputItemInWallet = usePrevious(defaultInputItemInWallet);

  const previousInputCurrency = usePrevious(inputCurrency);
  const previousOutputCurrency = usePrevious(outputCurrency);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const {
    updateUniswapInputCurrency,
    updateUniswapOutputCurrency,
  } = useUniswapCurrencyReserves();

  useEffect(() => {
    if (defaultOutputItem && !prevDefaultOutputItem) {
      updateUniswapOutputCurrency(defaultOutputItem);
    }
  }, [
    defaultInputItemInWallet,
    defaultOutputItem,
    prevDefaultOutputItem,
    updateUniswapOutputCurrency,
  ]);

  useEffect(() => {
    if (defaultInputItemInWallet && !prevDefaultInputItemInWallet) {
      updateUniswapInputCurrency(defaultInputItemInWallet);
    }
  }, [
    defaultInputItemInWallet,
    prevDefaultInputItemInWallet,
    updateUniswapInputCurrency,
  ]);

  const updateInputCurrency = useCallback(
    async (newInputCurrency, userSelected = true) => {
      logger.log(
        '[update input curr] new input curr, user selected?',
        newInputCurrency,
        userSelected
      );

      logger.log('[update input curr] prev input curr', previousInputCurrency);

      setInputCurrency(newInputCurrency);

      updateUniswapInputCurrency(newInputCurrency);

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
          '[update input curr] new deposit output for deposit or withdraw',
          defaultChosenInputItem
        );
        updateOutputCurrency(defaultChosenInputItem, false);
      }

      analytics.track('Switched input asset', {
        category,
        defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
        from: get(previousInputCurrency, 'symbol', ''),
        label: get(newInputCurrency, 'symbol', ''),
        type,
      });
    },
    [
      category,
      defaultChosenInputItem,
      defaultInputAddress,
      defaultInputAsset,
      isDeposit,
      isWithdrawal,
      outputCurrency,
      previousInputCurrency,
      type,
      updateOutputCurrency,
      updateUniswapInputCurrency,
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
      updateUniswapOutputCurrency(newOutputCurrency);

      setOutputCurrency(newOutputCurrency);

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
          updateInputCurrency(previousOutputCurrency, false);
        } else {
          logger.log('[update output curr] updating input curr with nothing');
          updateInputCurrency(null, false);
        }
      }

      analytics.track('Switched output asset', {
        category,
        defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
        from: get(previousOutputCurrency, 'symbol', ''),
        label: get(newOutputCurrency, 'symbol', ''),
        type,
      });
    },
    [
      category,
      defaultInputAsset,
      inputCurrency,
      previousOutputCurrency,
      type,
      uniswapAssetsInWallet,
      updateInputCurrency,
      updateUniswapOutputCurrency,
    ]
  );

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setParams({ focused: false });
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        category,
        headerTitle: inputHeaderTitle,
        onSelectCurrency: updateInputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
        type: CurrencySelectionTypes.input,
      });
    });
  }, [category, inputHeaderTitle, navigate, setParams, updateInputCurrency]);

  const navigateToSelectOutputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setParams({ focused: false });
      navigate(Routes.CURRENCY_SELECT_SCREEN, {
        category,
        headerTitle: 'Receive',
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => setParams({ focused: true }),
        type: CurrencySelectionTypes.output,
      });
    });
  }, [category, navigate, setParams, updateOutputCurrency]);

  return {
    defaultInputAddress,
    inputCurrency,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    outputCurrency,
    previousInputCurrency,
  };
}
