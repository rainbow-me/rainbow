import analytics from '@segment/analytics-react-native';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'react-native';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import styled from 'styled-components/primitives';
import { useMemoOne } from 'use-memo-one';
import { dismissingScreenListener } from '../../shim';
import {
  ConfirmExchangeButton,
  ExchangeDetailsRow,
  ExchangeFloatingPanels,
  ExchangeHeader,
  ExchangeInputField,
  ExchangeNotch,
  ExchangeOutputField,
} from '../components/exchange';
import SwapInfo from '../components/exchange/SwapInfo';
import { FloatingPanel } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import {
  ExchangeModalCategoryTypes,
  ExchangeModalTypes,
  isKeyboardOpen,
} from '@rainbow-me/helpers';
import {
  useAccountSettings,
  useBlockPolling,
  useGas,
  useMaxInputBalance,
  usePrevious,
  useSlippageDetails,
  useSwapDetails,
  useSwapInputRefs,
  useSwapInputs,
  useUniswapCurrencies,
  useUniswapMarketDetails,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { executeRap } from '@rainbow-me/raps/common';
import { ethUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { colors, position } from '@rainbow-me/styles';
import { backgroundTask, isETH, isNewValueForPath } from '@rainbow-me/utils';
import logger from 'logger';

const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const InnerWrapper = styled(Centered).attrs({
  direction: 'column',
})`
  ${ios
    ? position.sizeAsObject('100%')
    : `
    height: 500;
    top: 0;
  `};
  background-color: ${colors.transparent};
`;

export default function ExchangeModal({
  createRap,
  cTokenBalance,
  defaultInputAsset,
  defaultOutputAsset,
  estimateRap,
  showOutputField,
  supplyBalanceUnderlying,
  testID,
  title = 'Swap',
  type,
  underlyingPrice,
}) {
  const {
    navigate,
    setParams,
    dangerouslyGetParent,
    addListener,
  } = useNavigation();

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;

  const category =
    isDeposit || isWithdrawal
      ? ExchangeModalCategoryTypes.savings
      : ExchangeModalCategoryTypes.swap;
  const isSavings = category === ExchangeModalCategoryTypes.savings;

  const defaultGasLimit = isDeposit
    ? ethUnits.basic_deposit
    : isWithdrawal
    ? ethUnits.basic_withdrawal
    : ethUnits.basic_swap;

  const {
    prevSelectedGasPrice,
    selectedGasPrice,
    startPollingGasPrices,
    stopPollingGasPrices,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const { initWeb3Listener, stopWeb3Listener } = useBlockPolling();
  const { nativeCurrency } = useAccountSettings();
  const { maxInputBalance, updateMaxInputBalance } = useMaxInputBalance();

  const {
    areTradeDetailsValid,
    extraTradeDetails,
    updateExtraTradeDetails,
  } = useSwapDetails();

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [slippage, setSlippage] = useState(null);

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const {
    defaultInputAddress,
    inputCurrency,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
    onFlipCurrencies,
    outputCurrency,
    previousInputCurrency,
  } = useUniswapCurrencies({
    category,
    defaultInputAsset,
    defaultOutputAsset,
    isDeposit,
    isWithdrawal,
    title,
    type,
    underlyingPrice,
  });

  const {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs({
    inputCurrency,
    outputCurrency,
  });

  const {
    inputAmount,
    inputAmountDisplay,
    inputAsExactAmount,
    isMax,
    isSufficientBalance,
    nativeAmount,
    outputAmount,
    outputAmountDisplay,
    setIsSufficientBalance,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputs({
    category,
    defaultInputAsset,
    defaultOutputAsset,
    extraTradeDetails,
    inputCurrency,
    isWithdrawal,
    maxInputBalance,
    nativeFieldRef,
    outputCurrency,
    supplyBalanceUnderlying,
    type,
  });

  const isDismissing = useRef(false);
  useEffect(() => {
    if (ios) {
      return;
    }
    dismissingScreenListener.current = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = (
      dangerouslyGetParent()?.dangerouslyGetParent()?.addListener || addListener
    )('transitionEnd', ({ data: { closing } }) => {
      if (!closing && isDismissing.current) {
        isDismissing.current = false;
        lastFocusedInputHandle?.current?.focus();
      }
    });
    return () => {
      unsubscribe();
      dismissingScreenListener.current = undefined;
    };
  }, [addListener, dangerouslyGetParent, lastFocusedInputHandle]);

  const handleCustomGasBlur = useCallback(() => {
    lastFocusedInputHandle?.current?.focus();
  }, [lastFocusedInputHandle]);

  // Calculate market details
  const { isSufficientLiquidity, tradeDetails } = useUniswapMarketDetails({
    defaultInputAddress,
    extraTradeDetails,
    inputAmount,
    inputAsExactAmount,
    inputCurrency,
    inputFieldRef,
    isSavings,
    maxInputBalance,
    nativeCurrency,
    outputAmount,
    outputCurrency,
    outputFieldRef,
    setIsSufficientBalance,
    setSlippage,
    updateExtraTradeDetails,
    updateInputAmount,
    updateOutputAmount,
  });

  const updateGasLimit = useCallback(async () => {
    try {
      const gasLimit = await estimateRap({
        inputAmount,
        inputCurrency,
        outputAmount,
        outputCurrency,
        tradeDetails,
      });
      if (inputCurrency && outputCurrency) {
        updateTxFee(gasLimit);
      }
    } catch (error) {
      updateTxFee(defaultGasLimit);
    }
  }, [
    defaultGasLimit,
    estimateRap,
    inputAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
    tradeDetails,
    updateTxFee,
  ]);

  // Update gas limit
  useEffect(() => {
    updateGasLimit();
  }, [updateGasLimit]);

  // Set default gas limit
  useEffect(() => {
    setTimeout(() => {
      updateTxFee(defaultGasLimit);
    }, 1000);
  }, [defaultGasLimit, updateTxFee]);

  const clearForm = useCallback(() => {
    logger.log('[exchange] - clear form');
    inputFieldRef?.current?.clear();
    nativeFieldRef?.current?.clear();
    outputFieldRef?.current?.clear();
    updateInputAmount();
    updateMaxInputBalance();
  }, [
    inputFieldRef,
    nativeFieldRef,
    outputFieldRef,
    updateInputAmount,
    updateMaxInputBalance,
  ]);

  // Clear form and reset max input balance on new input currency
  useEffect(() => {
    if (isNewValueForPath(inputCurrency, previousInputCurrency, 'address')) {
      clearForm();
      updateMaxInputBalance(inputCurrency);
    }
  }, [clearForm, inputCurrency, previousInputCurrency, updateMaxInputBalance]);

  // Recalculate max input balance when gas price changes if input currency is ETH
  useEffect(() => {
    const prevGas = prevSelectedGasPrice?.txFee?.value?.amount || 0;
    const currentGas = selectedGasPrice?.txFee?.value?.amount || 0;
    if (isETH(inputCurrency?.address) && prevGas !== currentGas) {
      updateMaxInputBalance(inputCurrency);
    }
  }, [
    inputCurrency,
    prevSelectedGasPrice,
    selectedGasPrice,
    updateMaxInputBalance,
  ]);

  // Liten to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(
      isDeposit
        ? ethUnits.basic_deposit
        : isWithdrawal
        ? ethUnits.basic_withdrawal
        : ethUnits.basic_swap
    );
    startPollingGasPrices();
    initWeb3Listener();
    return () => {
      stopPollingGasPrices();
      stopWeb3Listener();
    };
  }, [
    initWeb3Listener,
    isDeposit,
    isWithdrawal,
    startPollingGasPrices,
    stopPollingGasPrices,
    stopWeb3Listener,
    updateDefaultGasLimit,
  ]);

  // Update input amount when max is set and the max input balance changed
  useEffect(() => {
    if (isMax) {
      let maxBalance = maxInputBalance;
      inputFieldRef?.current?.blur();
      if (isWithdrawal) {
        maxBalance = supplyBalanceUnderlying;
      }
      updateInputAmount(maxBalance, maxBalance, true, true);
    }
  }, [
    inputFieldRef,
    isMax,
    isWithdrawal,
    maxInputBalance,
    supplyBalanceUnderlying,
    updateInputAmount,
  ]);

  const { isHighSlippage } = useSlippageDetails(slippage);

  const isSlippageWarningVisible =
    isSufficientBalance && !!inputAmount && !!outputAmount && isHighSlippage;
  const prevIsSlippageWarningVisible = usePrevious(isSlippageWarningVisible);
  useEffect(() => {
    if (isSlippageWarningVisible && !prevIsSlippageWarningVisible) {
      analytics.track('Showing high slippage warning in Swap', {
        category,
        name: outputCurrency.name,
        slippage,
        symbol: outputCurrency.symbol,
        tokenAddress: outputCurrency.address,
        type,
      });
    }
  }, [
    category,
    isSlippageWarningVisible,
    outputCurrency,
    prevIsSlippageWarningVisible,
    slippage,
    type,
  ]);

  const handlePressMaxBalance = useCallback(async () => {
    let maxBalance = maxInputBalance;
    if (isWithdrawal) {
      maxBalance = supplyBalanceUnderlying;
    }
    analytics.track('Selected max balance', {
      category,
      defaultInputAsset: defaultInputAsset?.symbol || '',
      type,
      value: Number(maxBalance.toString()),
    });
    return updateInputAmount(maxBalance, maxBalance, true, true);
  }, [
    category,
    defaultInputAsset,
    isWithdrawal,
    maxInputBalance,
    supplyBalanceUnderlying,
    type,
    updateInputAmount,
  ]);

  const handleSubmit = useCallback(() => {
    backgroundTask.execute(async () => {
      analytics.track(`Submitted ${type}`, {
        category,
        defaultInputAsset: defaultInputAsset?.symbol || '',
        isSlippageWarningVisible,
        name: outputCurrency?.name || '',
        slippage,
        symbol: outputCurrency?.symbol || '',
        tokenAddress: outputCurrency?.address || '',
        type,
      });

      setIsAuthorizing(true);
      try {
        const wallet = await loadWallet();
        if (!wallet) {
          setIsAuthorizing(false);
          logger.sentry(`aborting ${type} due to missing wallet`);
          return;
        }

        setIsAuthorizing(false);
        const callback = () => {
          setParams({ focused: false });
          navigate(Routes.PROFILE_SCREEN);
        };
        const rap = await createRap({
          callback,
          inputAmount: isWithdrawal && isMax ? cTokenBalance : inputAmount,
          inputCurrency,
          isMax,
          outputAmount,
          outputCurrency,
          selectedGasPrice,
          tradeDetails,
        });
        logger.log('[exchange - handle submit] rap', rap);
        await executeRap(wallet, rap);
        logger.log('[exchange - handle submit] executed rap!');
        analytics.track(`Completed ${type}`, {
          category,
          defaultInputAsset: defaultInputAsset?.symbol || '',
          type,
        });
      } catch (error) {
        setIsAuthorizing(false);
        logger.log('[exchange - handle submit] error submitting swap', error);
        setParams({ focused: false });
        navigate(Routes.WALLET_SCREEN);
      }
    });
  }, [
    type,
    category,
    defaultInputAsset,
    isSlippageWarningVisible,
    outputCurrency,
    slippage,
    createRap,
    isWithdrawal,
    isMax,
    cTokenBalance,
    inputAmount,
    inputCurrency,
    outputAmount,
    selectedGasPrice,
    tradeDetails,
    setParams,
    navigate,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      asset: outputCurrency,
      disabled: !Number(inputAmountDisplay),
      isAuthorizing,
      isDeposit,
      isSufficientBalance,
      isSufficientLiquidity,
      onSubmit: handleSubmit,
      slippage,
      type,
    }),
    [
      handleSubmit,
      inputAmountDisplay,
      isAuthorizing,
      isDeposit,
      isSufficientBalance,
      isSufficientLiquidity,
      outputCurrency,
      slippage,
      testID,
      type,
    ]
  );

  const navigateToSwapDetailsModal = useCallback(() => {
    android && Keyboard.dismiss();
    const lastFocusedInputHandleTemporary = lastFocusedInputHandle.current;
    android && (lastFocusedInputHandle.current = null);
    inputFieldRef?.current?.blur();
    outputFieldRef?.current?.blur();
    nativeFieldRef?.current?.blur();
    const internalNavigate = () => {
      android && Keyboard.removeListener('keyboardDidHide', internalNavigate);
      setParams({ focused: false });
      navigate(Routes.SWAP_DETAILS_SHEET, {
        ...extraTradeDetails,
        confirmButtonProps,
        inputAmount,
        inputAmountDisplay,
        inputCurrency,
        outputAmount,
        outputAmountDisplay,
        outputCurrency,
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        slippage,
        type: 'swap_details',
      });
      analytics.track('Opened Swap Details modal', {
        category,
        name: outputCurrency?.name || '',
        symbol: outputCurrency?.symbol || '',
        tokenAddress: outputCurrency?.address || '',
        type,
      });
    };
    ios || !isKeyboardOpen()
      ? internalNavigate()
      : Keyboard.addListener('keyboardDidHide', internalNavigate);
  }, [
    category,
    confirmButtonProps,
    extraTradeDetails,
    inputAmount,
    inputAmountDisplay,
    inputCurrency,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    navigate,
    outputAmount,
    outputAmountDisplay,
    outputCurrency,
    outputFieldRef,
    setParams,
    slippage,
    type,
  ]);

  const showConfirmButton = isSavings
    ? !!inputCurrency
    : !!inputCurrency && !!outputCurrency;

  const showDetailsButton =
    !isSavings &&
    inputCurrency?.symbol &&
    outputCurrency?.symbol &&
    areTradeDetailsValid &&
    inputAmount > 0 &&
    outputAmountDisplay;

  return (
    <Wrapper>
      <InnerWrapper>
        <ExchangeFloatingPanels>
          <FloatingPanel
            overflow="visible"
            paddingBottom={showOutputField ? 0 : 26}
            radius={39}
            testID={testID}
          >
            {showOutputField && <ExchangeNotch />}
            <ExchangeHeader testID={testID} title={title} />
            <ExchangeInputField
              disableInputCurrencySelection={isWithdrawal}
              inputAmount={inputAmountDisplay}
              inputCurrencyAddress={inputCurrency?.address}
              inputCurrencySymbol={inputCurrency?.symbol}
              inputFieldRef={inputFieldRef}
              nativeAmount={nativeAmount}
              nativeCurrency={nativeCurrency}
              nativeFieldRef={nativeFieldRef}
              onFocus={handleFocus}
              onPressMaxBalance={handlePressMaxBalance}
              onPressSelectInputCurrency={navigateToSelectInputCurrency}
              setInputAmount={updateInputAmount}
              setNativeAmount={updateNativeAmount}
              testID={`${testID}-input`}
            />
            {showOutputField && (
              <ExchangeOutputField
                onFocus={handleFocus}
                onPressSelectOutputCurrency={navigateToSelectOutputCurrency}
                outputAmount={outputAmountDisplay}
                outputCurrencyAddress={outputCurrency?.address}
                outputCurrencySymbol={outputCurrency?.symbol}
                outputFieldRef={outputFieldRef}
                setOutputAmount={updateOutputAmount}
                testID={`${testID}-output`}
              />
            )}
          </FloatingPanel>
          {isDeposit && (
            <SwapInfo
              amount={(inputAmount > 0 && outputAmountDisplay) || null}
              asset={outputCurrency}
              testID="swap-info-button"
            />
          )}
          {!isDeposit && showConfirmButton && (
            <ExchangeDetailsRow
              isSlippageWarningVisible={isSlippageWarningVisible}
              onFlipCurrencies={onFlipCurrencies}
              onPressViewDetails={navigateToSwapDetailsModal}
              showDetailsButton={showDetailsButton}
              slippage={slippage}
            />
          )}
          {showConfirmButton && (
            <ConfirmExchangeButton
              {...confirmButtonProps}
              onPressViewDetails={navigateToSwapDetailsModal}
              testID={`${testID}-confirm`}
            />
          )}
          <GasSpeedButton
            dontBlur
            onCustomGasBlur={handleCustomGasBlur}
            testID={`${testID}-gas`}
            type={type}
          />
        </ExchangeFloatingPanels>
      </InnerWrapper>
    </Wrapper>
  );
}
