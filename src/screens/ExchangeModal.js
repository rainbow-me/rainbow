import analytics from '@segment/analytics-react-native';
import React, {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { Keyboard } from 'react-native';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
import { dismissingScreenListener } from '../../shim';
import {
  AnimatedExchangeFloatingPanels,
  ConfirmExchangeButton,
  DepositInfo,
  ExchangeDetailsRow,
  ExchangeFloatingPanels,
  ExchangeHeader,
  ExchangeInputField,
  ExchangeNotch,
  ExchangeOutputField,
} from '../components/exchange';
import { FloatingPanel } from '../components/floating-panels';
import { GasSpeedButton } from '../components/gas';
import { Centered, KeyboardFixedOpenLayout } from '../components/layout';
import { ExchangeModalTypes, isKeyboardOpen } from '@rainbow-me/helpers';
import {
  useAccountSettings,
  useBlockPolling,
  useGas,
  usePriceImpactDetails,
  useSwapDetails,
  useSwapInputOutputTokens,
  useSwapInputRefs,
  useSwapInputs,
  useSwapInputValues,
  useSwapIsSufficientBalance,
  useUniswapCurrencies,
  useUniswapMarketDetails,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { executeRap } from '@rainbow-me/raps/common';
import { updateSwapTypeDetails } from '@rainbow-me/redux/swap';
import { ethUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import { position } from '@rainbow-me/styles';
import { backgroundTask, isETH } from '@rainbow-me/utils';
import logger from 'logger';

const FloatingPanels = ios
  ? AnimatedExchangeFloatingPanels
  : ExchangeFloatingPanels;

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
  background-color: ${({ theme: { colors } }) => colors.transparent};
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
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    const typeSpecificParameters = {
      cTokenBalance,
      supplyBalanceUnderlying,
      underlyingPrice,
    };
    dispatch(updateSwapTypeDetails(type, typeSpecificParameters));
  }, [cTokenBalance, dispatch, supplyBalanceUnderlying, type, underlyingPrice]);

  const {
    navigate,
    setParams,
    dangerouslyGetParent,
    addListener,
  } = useNavigation();

  const isDeposit = type === ExchangeModalTypes.deposit;
  const isWithdrawal = type === ExchangeModalTypes.withdrawal;
  const isSavings = isDeposit || isWithdrawal;

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

  const { maxInputBalance } = useSwapIsSufficientBalance();

  const { initWeb3Listener, stopWeb3Listener } = useBlockPolling();
  const { nativeCurrency } = useAccountSettings();

  const { areTradeDetailsValid, tradeDetails } = useSwapDetails();
  const { isHighPriceImpact, percentDisplay } = usePriceImpactDetails();

  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const {
    defaultInputAddress,
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
  } = useUniswapCurrencies({
    defaultInputAsset,
    defaultOutputAsset,
    isDeposit,
    isWithdrawal,
    title,
    type,
    underlyingPrice,
  });

  const { inputCurrency, outputCurrency } = useSwapInputOutputTokens();

  const {
    clearAllInputRefs,
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs();

  const {
    resetAmounts,
    updateInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputs();

  const {
    inputAmount,
    inputAmountDisplay,
    nativeAmount,
    isMax,
    outputAmount,
    outputAmountDisplay,
  } = useSwapInputValues();

  const clearForm = useCallback(() => {
    logger.log('[exchange] - clear form');
    clearAllInputRefs();
    resetAmounts();
  }, [clearAllInputRefs, resetAmounts]);

  const onFlipCurrencies = useCallback(() => {
    const useOutputAmount = outputFieldRef?.current?.isFocused();
    flipCurrencies(useOutputAmount);
  }, [flipCurrencies, outputFieldRef]);

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
  const { isSufficientLiquidity } = useUniswapMarketDetails({
    defaultInputAddress,
    isSavings,
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

  // Liten to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(defaultGasLimit);
    startPollingGasPrices();
    initWeb3Listener();
    return () => {
      stopPollingGasPrices();
      stopWeb3Listener();
    };
  }, [
    defaultGasLimit,
    initWeb3Listener,
    startPollingGasPrices,
    stopPollingGasPrices,
    stopWeb3Listener,
    updateDefaultGasLimit,
  ]);

  // Update input balance when gas price changes if max and input currency is ETH
  useEffect(() => {
    if (!(isMax && isETH(inputCurrency?.address))) return;
    const prevGas = prevSelectedGasPrice?.txFee?.value?.amount || 0;
    const currentGas = selectedGasPrice?.txFee?.value?.amount || 0;
    if (prevGas !== currentGas) {
      updateInputAmount(maxInputBalance, true);
    }
  }, [
    isMax,
    inputCurrency?.address,
    maxInputBalance,
    prevSelectedGasPrice,
    selectedGasPrice,
    updateInputAmount,
  ]);

  const handlePressMaxBalance = useCallback(async () => {
    updateInputAmount(maxInputBalance, true);
  }, [maxInputBalance, updateInputAmount]);

  const handleSubmit = useCallback(() => {
    backgroundTask.execute(async () => {
      analytics.track(`Submitted ${type}`, {
        defaultInputAsset: defaultInputAsset?.symbol ?? '',
        isHighPriceImpact,
        name: outputCurrency?.name ?? '',
        priceImpact: percentDisplay,
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
    createRap,
    cTokenBalance,
    defaultInputAsset,
    inputAmount,
    inputCurrency,
    isMax,
    isHighPriceImpact,
    isWithdrawal,
    navigate,
    outputAmount,
    outputCurrency,
    percentDisplay,
    selectedGasPrice,
    setParams,
    tradeDetails,
    type,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      disabled: !Number(inputAmountDisplay),
      isAuthorizing,
      isDeposit,
      isSufficientLiquidity,
      onSubmit: handleSubmit,
      type,
    }),
    [
      handleSubmit,
      inputAmountDisplay,
      isAuthorizing,
      isDeposit,
      isSufficientLiquidity,
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
        confirmButtonProps,
        restoreFocusOnSwapModal: () => {
          android &&
            (lastFocusedInputHandle.current = lastFocusedInputHandleTemporary);
          setParams({ focused: true });
        },
        type: 'swap_details',
      });
      analytics.track('Opened Swap Details modal', {
        name: outputCurrency?.name ?? '',
        symbol: outputCurrency?.symbol ?? '',
        tokenAddress: outputCurrency?.address ?? '',
        type,
      });
    };
    ios || !isKeyboardOpen()
      ? internalNavigate()
      : Keyboard.addListener('keyboardDidHide', internalNavigate);
  }, [
    confirmButtonProps,
    inputFieldRef,
    lastFocusedInputHandle,
    nativeFieldRef,
    navigate,
    outputCurrency,
    outputFieldRef,
    setParams,
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
        <FloatingPanels>
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
            <DepositInfo
              amount={(inputAmount > 0 && outputAmountDisplay) || null}
              asset={outputCurrency}
              testID="deposit-info-button"
            />
          )}
          {!isDeposit && showConfirmButton && (
            <ExchangeDetailsRow
              onFlipCurrencies={onFlipCurrencies}
              onPressViewDetails={navigateToSwapDetailsModal}
              showDetailsButton={showDetailsButton}
              type={type}
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
        </FloatingPanels>
      </InnerWrapper>
    </Wrapper>
  );
}
