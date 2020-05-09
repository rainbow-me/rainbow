/* eslint-disable no-use-before-define */
import analytics from '@segment/analytics-react-native';
import { find, get, toLower } from 'lodash';
import { useCallback, useState } from 'react';
import { InteractionManager } from 'react-native';
import { useDispatch } from 'react-redux';
import CurrencySelectionTypes from '../helpers/currencySelectionTypes';
import { multiply } from '../helpers/utilities';
import { ethereumUtils, logger } from '../utils';
import useAccountAssets from './useAccountAssets';
import usePrevious from './usePrevious';
import useUniswapAllowances from './useUniswapAllowances';
import useUniswapAssetsInWallet from './useUniswapAssetsInWallet';

const isSameAsset = (a, b) => {
  if (!a || !b) return false;
  const assetA = toLower(get(a, 'address', ''));
  const assetB = toLower(get(b, 'address', ''));
  return assetA === assetB;
};

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
  clearForm,
  defaultInputAsset,
  inputHeaderTitle,
  isDeposit,
  isWithdrawal,
  navigation,
  selectedGasPrice,
  setShowConfirmButton,
  setInputAsExactAmount,
  setInputBalance,
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
    (!defaultInputItemInWallet ||
      defaultInputItemInWallet.address !== defaultInputAddress)
  ) {
    defaultOutputItem = defaultChosenInputItem;
  }

  const [inputCurrency, setInputCurrency] = useState(defaultInputItemInWallet);
  const [outputCurrency, setOutputCurrency] = useState(defaultOutputItem);

  const previousInputCurrency = usePrevious(inputCurrency);
  const previousOutputCurrency = usePrevious(outputCurrency);

  const { uniswapAssetsInWallet } = useUniswapAssetsInWallet();
  const {
    uniswapUpdateInputCurrency,
    uniswapUpdateOutputCurrency,
  } = useUniswapAllowances();

  const dispatch = useDispatch();

  const updateInputCurrency = useCallback(
    async (newInputCurrency, userSelected = true) => {
      logger.log(
        '[update input curr] new input curr, user selected?',
        newInputCurrency,
        userSelected
      );

      logger.log('[update input curr] prev input curr', previousInputCurrency);
      if (!isSameAsset(newInputCurrency, previousInputCurrency)) {
        logger.log('[update input curr] clear form');
        clearForm();
      }

      logger.log('[update input curr] setting input curr', newInputCurrency);
      setInputCurrency(newInputCurrency);
      setShowConfirmButton(
        isDeposit || isWithdrawal
          ? !!newInputCurrency
          : !!newInputCurrency && !!outputCurrency
      );

      dispatch(uniswapUpdateInputCurrency(newInputCurrency));

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

      if (isDeposit && newInputCurrency.address !== defaultInputAddress) {
        logger.log(
          '[update input curr] new deposit output for deposit or withdraw',
          defaultChosenInputItem
        );
        updateOutputCurrency(defaultChosenInputItem, false);
      }

      // Update current balance
      const inputBalance = await ethereumUtils.getBalanceAmount(
        selectedGasPrice,
        newInputCurrency
      );
      setInputBalance(inputBalance);

      analytics.track('Switched input asset', {
        category: isDeposit ? 'savings' : 'swap',
        defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
        from: (previousInputCurrency && previousInputCurrency.symbol) || '',
        label: newInputCurrency.symbol,
        type,
      });
    },
    [
      clearForm,
      defaultChosenInputItem,
      defaultInputAddress,
      defaultInputAsset,
      dispatch,
      isDeposit,
      isWithdrawal,
      outputCurrency,
      previousInputCurrency,
      selectedGasPrice,
      setInputBalance,
      setShowConfirmButton,
      type,
      uniswapUpdateInputCurrency,
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
      dispatch(uniswapUpdateOutputCurrency(newOutputCurrency));

      setInputAsExactAmount(true);
      setOutputCurrency(newOutputCurrency);
      setShowConfirmButton(
        isDeposit || isWithdrawal
          ? !!inputCurrency
          : !!inputCurrency && !!newOutputCurrency
      );

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
        defaultInputAsset: defaultInputAsset && defaultInputAsset.symbol,
        from: (previousOutputCurrency && previousOutputCurrency.symbol) || null,
        label: newOutputCurrency.symbol,
        type,
      });
    },
    [
      defaultInputAsset,
      dispatch,
      inputCurrency,
      isDeposit,
      isWithdrawal,
      previousOutputCurrency,
      setInputAsExactAmount,
      setShowConfirmButton,
      type,
      uniswapAssetsInWallet,
      uniswapUpdateOutputCurrency,
      updateInputCurrency,
    ]
  );

  const navigateToSelectInputCurrency = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate('CurrencySelectScreen', {
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
    logger.log('[nav to select output curr]', inputCurrency);
    InteractionManager.runAfterInteractions(() => {
      navigation.setParams({ focused: false });
      navigation.navigate('CurrencySelectScreen', {
        headerTitle: 'Receive',
        onSelectCurrency: updateOutputCurrency,
        restoreFocusOnSwapModal: () => {
          navigation.setParams({ focused: true });
        },
        type: CurrencySelectionTypes.output,
      });
    });
  }, [inputCurrency, navigation, updateOutputCurrency]);

  return {
    defaultInputAddress,
    inputCurrency,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    outputCurrency,
  };
}
