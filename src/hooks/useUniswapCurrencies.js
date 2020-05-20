/* eslint-disable no-use-before-define */
import analytics from '@segment/analytics-react-native';
import { find, get } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import CurrencySelectionTypes from '../helpers/currencySelectionTypes';
import { multiply } from '../helpers/utilities';
import Routes from '../screens/Routes/routesNames';
import { ethereumUtils, isNewValueForPath, logger } from '../utils';
import useAccountAssets from './useAccountAssets';
import usePrevious from './usePrevious';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';
import useUniswapCurrencyReserves from './useUniswapCurrencyReserves';

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
  navigation,
  type,
  underlyingPrice,
}) {
  const { allAssets } = useAccountAssets();
  const defaultInputAddress = get(defaultInputAsset, 'address');
  let defaultInputItemInWallet = ethereumUtils.getAsset(
    allAssets,
    defaultInputAddress
  );

  let defaultChosenInputItem = defaultInputItemInWallet;

  if (!defaultChosenInputItem && defaultInputAsset) {
    const eth = ethereumUtils.getAsset(allAssets);
    const priceOfEther = get(eth, 'native.price.amount', null);
    defaultChosenInputItem = createMissingAsset(
      defaultInputAsset,
      underlyingPrice,
      priceOfEther
    );
  }
  if (!defaultInputItemInWallet && isWithdrawal) {
    defaultInputItemInWallet = defaultChosenInputItem;
  } else if (!defaultInputItemInWallet) {
    defaultInputItemInWallet = ethereumUtils.getAsset(allAssets);
  }

  let defaultOutputItem = null;

  if (
    isDeposit &&
    get(defaultInputItemInWallet, 'address') !== defaultInputAddress
  ) {
    defaultOutputItem = defaultChosenInputItem;
  }

  const [inputCurrency, setInputCurrency] = useState(defaultInputItemInWallet);
  const [outputCurrency, setOutputCurrency] = useState(defaultOutputItem);

  useEffect(() => {
    if (defaultOutputItem) {
      updateUniswapInputCurrency(defaultInputItemInWallet);
      updateUniswapOutputCurrency(defaultOutputItem);
    }
  }, [updateUniswapInputCurrency, updateUniswapOutputCurrency]);

  const previousInputCurrency = usePrevious(inputCurrency);
  const previousOutputCurrency = usePrevious(outputCurrency);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const {
    updateUniswapInputCurrency,
    updateUniswapOutputCurrency,
  } = useUniswapCurrencyReserves();

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
        category: isDeposit ? 'savings' : 'swap',
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
        category: isWithdrawal || isDeposit ? 'savings' : 'swap',
        defaultInputAsset: get(defaultInputAsset, 'symbol', ''),
        from: get(previousOutputCurrency, 'symbol', ''),
        label: get(newOutputCurrency, 'symbol', ''),
        type,
      });
    },
    [
      defaultInputAsset,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      previousOutputCurrency,
      type,
      uniswapAssetsInWallet,
      updateInputCurrency,
      updateUniswapOutputCurrency,
    ]
  );

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate(Routes.CURRENCY_SELECT_SCREEN, {
        headerTitle: inputHeaderTitle,
        onSelectCurrency: updateInputCurrency,
        restoreFocusOnSwapModal: () => {
          navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.input,
      });
    });
  }, [inputHeaderTitle, navigation, updateInputCurrency]);

  const navigateToSelectOutputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate(Routes.CURRENCY_SELECT_SCREEN, {
        headerTitle: 'Receive',
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => {
          navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.output,
      });
    });
  }, [navigation, updateOutputCurrency]);

  return {
    defaultInputAddress,
    inputCurrency,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    outputCurrency,
    previousInputCurrency,
  };
}
