import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  InteractionManager,
  Keyboard,
  NativeModules,
} from 'react-native';
import { useSafeArea } from 'react-native-safe-area-context';
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch, useSelector } from 'react-redux';
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
import { divide, greaterThan, multiply } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useBlockPolling,
  useCurrentNonce,
  useDimensions,
  useGas,
  usePrevious,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapCurrencyHandlers,
  useSwapDerivedOutputs,
  useSwapInputHandlers,
  useSwapInputRefs,
} from '@rainbow-me/hooks';
import { loadWallet } from '@rainbow-me/model/wallet';
import { useNavigation } from '@rainbow-me/navigation';
import { executeRap, getRapEstimationByType } from '@rainbow-me/raps';
import { multicallClearState } from '@rainbow-me/redux/multicall';
import { swapClearState, updateSwapTypeDetails } from '@rainbow-me/redux/swap';
import { ETH_ADDRESS, ethUnits } from '@rainbow-me/references';
import Routes from '@rainbow-me/routes';
import styled from '@rainbow-me/styled-components';
import { position } from '@rainbow-me/styles';
import { useEthUSDPrice } from '@rainbow-me/utils/ethereumUtils';
import logger from 'logger';

const FloatingPanels = ios
  ? AnimatedExchangeFloatingPanels
  : ExchangeFloatingPanels;

const Wrapper = KeyboardFixedOpenLayout;

const InnerWrapper = styled(Centered).attrs({
  direction: 'column',
})(({ isSmallPhone, theme: { colors } }) => ({
  ...position.sizeAsObject('100%'),
  ...(ios && isSmallPhone && { maxHeight: 354 }),
  backgroundColor: colors.transparent,
}));

const Spacer = styled.View({
  height: 20,
});

const getInputHeaderTitle = (type, defaultInputAsset) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return 'Deposit';
    case ExchangeModalTypes.withdrawal:
      return `Withdraw ${defaultInputAsset.symbol}`;
    default:
      return 'Swap';
  }
};

const getShowOutputField = type => {
  switch (type) {
    case ExchangeModalTypes.deposit:
    case ExchangeModalTypes.withdrawal:
      return false;
    default:
      return true;
  }
};

export default function ExchangeModal({
  defaultInputAsset,
  defaultOutputAsset,
  testID,
  type,
  typeSpecificParams,
}) {
  const { isSmallPhone } = useDimensions();
  const dispatch = useDispatch();
  const insets = useSafeArea();

  useLayoutEffect(() => {
    dispatch(updateSwapTypeDetails(type, typeSpecificParams));
  }, [dispatch, type, typeSpecificParams]);

  const title = getInputHeaderTitle(type, defaultInputAsset);
  const showOutputField = getShowOutputField(type);
  const priceOfEther = useEthUSDPrice();
  const genericAssets = useSelector(
    ({ data: { genericAssets } }) => genericAssets
  );

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
    selectedGasFee,
    gasFeeParamsBySpeed,
    startPollingGasFees,
    stopPollingGasFees,
    updateDefaultGasLimit,
    updateTxFee,
  } = useGas();
  const { initWeb3Listener, stopWeb3Listener } = useBlockPolling();
  const { accountAddress, nativeCurrency, network } = useAccountSettings();
  const getNextNonce = useCurrentNonce(accountAddress, network);

  const [isAuthorizing, setIsAuthorizing] = useState(false);

  const prevGasFeesParamsBySpeed = usePrevious(gasFeeParamsBySpeed);

  useAndroidBackHandler(() => {
    navigate(Routes.WALLET_SCREEN);
    return true;
  });

  const { inputCurrency, outputCurrency } = useSwapCurrencies();

  const {
    handleFocus,
    inputFieldRef,
    lastFocusedInputHandle,
    setLastFocusedInputHandle,
    nativeFieldRef,
    outputFieldRef,
  } = useSwapInputRefs();

  const {
    updateInputAmount,
    updateMaxInputAmount,
    updateNativeAmount,
    updateOutputAmount,
  } = useSwapInputHandlers();

  const {
    flipCurrencies,
    navigateToSelectInputCurrency,
    navigateToSelectOutputCurrency,
  } = useSwapCurrencyHandlers({
    defaultInputAsset,
    defaultOutputAsset,
    inputFieldRef,
    lastFocusedInputHandle,
    outputFieldRef,
    setLastFocusedInputHandle,
    title,
    type,
  });

  const {
    derivedValues: { inputAmount, nativeAmount, outputAmount },
    displayValues: { inputAmountDisplay, outputAmountDisplay },
    doneLoadingReserves,
    tradeDetails,
  } = useSwapDerivedOutputs();

  const {
    isHighPriceImpact,
    outputPriceValue,
    priceImpactColor,
    priceImpactNativeAmount,
    priceImpactPercentDisplay,
  } = usePriceImpactDetails(inputAmount, outputAmount, tradeDetails);

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

  useEffect(() => {
    return () => {
      dispatch(swapClearState());
      dispatch(multicallClearState());
    };
  }, [dispatch]);

  const handleCustomGasBlur = useCallback(() => {
    lastFocusedInputHandle?.current?.focus();
  }, [lastFocusedInputHandle]);

  const updateGasLimit = useCallback(async () => {
    try {
      if (
        ((type === ExchangeModalTypes.swap ||
          type === ExchangeModalTypes.deposit) &&
          !(inputCurrency && outputCurrency)) ||
        type === ExchangeModalTypes.withdraw
      ) {
        return;
      }
      const swapParams = {
        inputAmount,
        outputAmount,
        tradeDetails,
      };
      const gasLimit = await getRapEstimationByType(type, {
        swapParameters: swapParams,
      });
      if (gasLimit) {
        updateTxFee(gasLimit);
      }
    } catch (error) {
      updateTxFee(defaultGasLimit);
    }
  }, [
    defaultGasLimit,
    inputAmount,
    inputCurrency,
    outputAmount,
    outputCurrency,
    tradeDetails,
    type,
    updateTxFee,
  ]);

  // Set default gas limit
  useEffect(() => {
    if (isEmpty(prevGasFeesParamsBySpeed) && !isEmpty(gasFeeParamsBySpeed)) {
      updateTxFee(defaultGasLimit);
    }
  }, [
    defaultGasLimit,
    gasFeeParamsBySpeed,
    prevGasFeesParamsBySpeed,
    updateTxFee,
  ]);

  // Update gas limit
  useEffect(() => {
    if (!isEmpty(gasFeeParamsBySpeed)) {
      updateGasLimit();
    }
  }, [gasFeeParamsBySpeed, updateGasLimit]);

  // Liten to gas prices, Uniswap reserves updates
  useEffect(() => {
    updateDefaultGasLimit(defaultGasLimit);
    InteractionManager.runAfterInteractions(() => {
      startPollingGasFees();
    });
    initWeb3Listener();
    return () => {
      stopPollingGasFees();
      stopWeb3Listener();
    };
  }, [
    defaultGasLimit,
    network,
    initWeb3Listener,
    startPollingGasFees,
    stopPollingGasFees,
    stopWeb3Listener,
    updateDefaultGasLimit,
  ]);

  const handlePressMaxBalance = useCallback(async () => {
    updateMaxInputAmount();
  }, [updateMaxInputAmount]);

  const checkGasVsOutput = async (gasPrice, outputPrice) => {
    if (greaterThan(outputPrice, 0) && greaterThan(gasPrice, outputPrice)) {
      const res = new Promise(resolve => {
        Alert.alert(
          'Are you sure?',
          'This transaction will cost you more than the value you are swapping to, are you sure you want to continue?',
          [
            {
              onPress: () => {
                resolve(false);
              },
              text: 'Proceed Anyway',
            },
            {
              onPress: () => {
                resolve(true);
              },
              style: 'cancel',
              text: 'Cancel',
            },
          ]
        );
      });
      return res;
    } else {
      return false;
    }
  };

  const handleSubmit = useCallback(async () => {
    let amountInUSD = 0;
    let NotificationManager = ios ? NativeModules.NotificationManager : null;
    try {
      // Tell iOS we're running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapInProgress');
      if (nativeCurrency === 'usd') {
        amountInUSD = nativeAmount;
      } else {
        const ethPriceInNativeCurrency =
          genericAssets[ETH_ADDRESS]?.price?.value ?? 0;
        const tokenPriceInNativeCurrency =
          genericAssets[inputCurrency?.address]?.price?.value ?? 0;
        const tokensPerEth = divide(
          tokenPriceInNativeCurrency,
          ethPriceInNativeCurrency
        );
        const inputTokensInEth = multiply(tokensPerEth, inputAmount);
        amountInUSD = multiply(priceOfEther, inputTokensInEth);
      }
    } catch (e) {
      logger.log('error getting the swap amount in USD price', e);
    } finally {
      analytics.track(`Submitted ${type}`, {
        amountInUSD,
        defaultInputAsset: defaultInputAsset?.symbol ?? '',
        isHighPriceImpact,
        name: outputCurrency?.name ?? '',
        priceImpact: priceImpactPercentDisplay,
        symbol: outputCurrency?.symbol || '',
        tokenAddress: outputCurrency?.address || '',
        type,
      });
    }

    const outputInUSD = multiply(outputPriceValue, outputAmount);
    const gasPrice = selectedGasFee?.gasFee?.maxFee?.native?.value?.amount;
    const cancelTransaction = await checkGasVsOutput(gasPrice, outputInUSD);

    if (cancelTransaction) {
      return;
    }

    setIsAuthorizing(true);
    try {
      const wallet = await loadWallet();
      if (!wallet) {
        setIsAuthorizing(false);
        logger.sentry(`aborting ${type} due to missing wallet`);
        return;
      }

      const callback = (success = false, errorMessage = null) => {
        setIsAuthorizing(false);
        if (success) {
          setParams({ focused: false });
          navigate(Routes.PROFILE_SCREEN);
        } else if (errorMessage) {
          Alert.alert(errorMessage);
        }
      };
      logger.log('[exchange - handle submit] rap');
      const nonce = await getNextNonce();
      const swapParameters = {
        inputAmount,
        nonce,
        outputAmount,
        tradeDetails,
      };
      await executeRap(wallet, type, { swapParameters }, callback);
      logger.log('[exchange - handle submit] executed rap!');
      analytics.track(`Completed ${type}`, {
        amountInUSD,
        input: defaultInputAsset?.symbol || '',
        output: outputCurrency?.symbol || '',
        type,
      });
      // Tell iOS we finished running a rap (for tracking purposes)
      NotificationManager &&
        NotificationManager.postNotification('rapCompleted');
    } catch (error) {
      setIsAuthorizing(false);
      logger.log('[exchange - handle submit] error submitting swap', error);
      setParams({ focused: false });
      navigate(Routes.WALLET_SCREEN);
    }
  }, [
    defaultInputAsset?.symbol,
    genericAssets,
    getNextNonce,
    inputAmount,
    inputCurrency?.address,
    isHighPriceImpact,
    nativeAmount,
    nativeCurrency,
    navigate,
    outputAmount,
    outputCurrency?.address,
    outputCurrency?.name,
    outputCurrency?.symbol,
    outputPriceValue,
    priceImpactPercentDisplay,
    priceOfEther,
    selectedGasFee?.gasFee?.maxFee?.native?.value?.amount,
    setParams,
    tradeDetails,
    type,
  ]);

  const confirmButtonProps = useMemoOne(
    () => ({
      disabled: !Number(inputAmount),
      doneLoadingReserves,
      inputAmount,
      isAuthorizing,
      isHighPriceImpact,
      onSubmit: handleSubmit,
      tradeDetails,
      type,
    }),
    [
      doneLoadingReserves,
      handleSubmit,
      inputAmount,
      isAuthorizing,
      isHighPriceImpact,
      testID,
      tradeDetails,
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

  return (
    <Wrapper>
      <InnerWrapper isSmallPhone={isSmallPhone}>
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
              editable={!!inputCurrency}
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
                editable={!!outputCurrency}
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
              amount={(inputAmount > 0 && outputAmount) || null}
              asset={outputCurrency}
              isHighPriceImpact={isHighPriceImpact}
              onPress={navigateToSwapDetailsModal}
              priceImpactColor={priceImpactColor}
              priceImpactNativeAmount={priceImpactNativeAmount}
              priceImpactPercentDisplay={priceImpactPercentDisplay}
              testID="deposit-info-button"
            />
          )}
          {!isSavings && showConfirmButton && (
            <ExchangeDetailsRow
              isHighPriceImpact={isHighPriceImpact}
              onFlipCurrencies={flipCurrencies}
              onPressViewDetails={navigateToSwapDetailsModal}
              priceImpactColor={priceImpactColor}
              priceImpactNativeAmount={priceImpactNativeAmount}
              priceImpactPercentDisplay={priceImpactPercentDisplay}
              showDetailsButton={!!tradeDetails}
              type={type}
            />
          )}
          {isWithdrawal && <Spacer />}
          {showConfirmButton && (
            <ConfirmExchangeButton
              {...confirmButtonProps}
              onPressViewDetails={navigateToSwapDetailsModal}
              testID={`${testID}-confirm-button`}
            />
          )}
        </FloatingPanels>
        <GasSpeedButton
          asset={outputCurrency}
          bottom={insets.bottom - 7}
          currentNetwork={network}
          dontBlur
          onCustomGasBlur={handleCustomGasBlur}
          testID={`${testID}-gas`}
        />
      </InnerWrapper>
    </Wrapper>
  );
}
