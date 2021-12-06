import analytics from '@segment/analytics-react-native';
import { isEmpty } from 'lodash';
import React, {
  Fragment,
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
import { useAndroidBackHandler } from 'react-navigation-backhandler';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { useMemoOne } from 'use-memo-one';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module '../.... Remove this comment to see the full error message
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
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers' or its co... Remove this comment to see the full error message
import { ExchangeModalTypes, isKeyboardOpen } from '@rainbow-me/helpers';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/helpers/utilities'... Remove this comment to see the full error message
import { divide, greaterThan, multiply } from '@rainbow-me/helpers/utilities';
import {
  useAccountSettings,
  useBlockPolling,
  useCurrentNonce,
  useGas,
  usePrevious,
  usePriceImpactDetails,
  useSwapCurrencies,
  useSwapCurrencyHandlers,
  useSwapDerivedOutputs,
  useSwapInputHandlers,
  useSwapInputRefs,
  // @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/hooks' or its corr... Remove this comment to see the full error message
} from '@rainbow-me/hooks';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/model/wallet' or i... Remove this comment to see the full error message
import { loadWallet } from '@rainbow-me/model/wallet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/navigation' or its... Remove this comment to see the full error message
import { useNavigation } from '@rainbow-me/navigation';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/raps' or its corre... Remove this comment to see the full error message
import { executeRap, getRapEstimationByType } from '@rainbow-me/raps';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/multicall' o... Remove this comment to see the full error message
import { multicallClearState } from '@rainbow-me/redux/multicall';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/redux/swap' or its... Remove this comment to see the full error message
import { swapClearState, updateSwapTypeDetails } from '@rainbow-me/redux/swap';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/references' or its... Remove this comment to see the full error message
import { ETH_ADDRESS, ethUnits } from '@rainbow-me/references';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/routes' or its cor... Remove this comment to see the full error message
import Routes from '@rainbow-me/routes';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { position } from '@rainbow-me/styles';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils/ethereumUtil... Remove this comment to see the full error message
import { useEthUSDPrice } from '@rainbow-me/utils/ethereumUtils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module 'logger' or its corresponding t... Remove this comment to see the full error message
import logger from 'logger';

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const FloatingPanels = ios
  ? AnimatedExchangeFloatingPanels
  : ExchangeFloatingPanels;

// @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
const Wrapper = ios ? KeyboardFixedOpenLayout : Fragment;

const InnerWrapper = styled(Centered).attrs({
  direction: 'column',
})`
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
  ${ios
    ? position.sizeAsObject('100%')
    : `
    height: 500;
    top: 0;
  `};
  background-color: ${({ theme: { colors } }) => colors.transparent};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Spacer = styled.View`
  height: 20;
`;

const getInputHeaderTitle = (type: any, defaultInputAsset: any) => {
  switch (type) {
    case ExchangeModalTypes.deposit:
      return 'Deposit';
    case ExchangeModalTypes.withdrawal:
      return `Withdraw ${defaultInputAsset.symbol}`;
    default:
      return 'Swap';
  }
};

const getShowOutputField = (type: any) => {
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
}: any) {
  const dispatch = useDispatch();

  useLayoutEffect(() => {
    dispatch(updateSwapTypeDetails(type, typeSpecificParams));
  }, [dispatch, type, typeSpecificParams]);

  const title = getInputHeaderTitle(type, defaultInputAsset);
  const showOutputField = getShowOutputField(type);
  const priceOfEther = useEthUSDPrice();
  const genericAssets = useSelector(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'data' does not exist on type 'DefaultRoo... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
    if (ios) {
      return;
    }
    dismissingScreenListener.current = () => {
      Keyboard.dismiss();
      isDismissing.current = true;
    };
    const unsubscribe = (
      dangerouslyGetParent()?.dangerouslyGetParent()?.addListener || addListener
    )('transitionEnd', ({ data: { closing } }: any) => {
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
      const gasLimit = await getRapEstimationByType(type, swapParams);
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

  const checkGasVsOutput = async (gasPrice: any, outputPrice: any) => {
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
          // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'null' is not assignable to param... Remove this comment to see the full error message
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
      await executeRap(wallet, type, swapParameters, callback);
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && Keyboard.dismiss();
    const lastFocusedInputHandleTemporary = lastFocusedInputHandle.current;
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
    android && (lastFocusedInputHandle.current = null);
    inputFieldRef?.current?.blur();
    outputFieldRef?.current?.blur();
    nativeFieldRef?.current?.blur();
    const internalNavigate = () => {
      // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
      android && Keyboard.removeListener('keyboardDidHide', internalNavigate);
      setParams({ focused: false });
      navigate(Routes.SWAP_DETAILS_SHEET, {
        confirmButtonProps,
        restoreFocusOnSwapModal: () => {
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
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
    // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'ios'.
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Wrapper>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <InnerWrapper>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <FloatingPanels>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <FloatingPanel
            overflow="visible"
            paddingBottom={showOutputField ? 0 : 26}
            radius={39}
            testID={testID}
          >
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            {showOutputField && <ExchangeNotch />}
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
            <ExchangeHeader testID={testID} title={title} />
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless
            the '--jsx' flag is provided... Remove this comment to see the full
            error message
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
              // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          {isWithdrawal && <Spacer />}
          {showConfirmButton && (
            // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
            <ConfirmExchangeButton
              {...confirmButtonProps}
              onPressViewDetails={navigateToSwapDetailsModal}
              testID={`${testID}-confirm-button`}
            />
          )}
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <GasSpeedButton
            asset={outputCurrency}
            currentNetwork={network}
            dontBlur
            onCustomGasBlur={handleCustomGasBlur}
            testID={`${testID}-gas`}
            topPadding={25}
          />
        </FloatingPanels>
      </InnerWrapper>
    </Wrapper>
  );
}
