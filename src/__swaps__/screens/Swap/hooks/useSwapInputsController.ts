import { useCallback, useRef } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '@/__swaps__/screens/Swap/constants';
import { SWAP_FEE } from '@/__swaps__/screens/Swap/dummyValues';
import { inputKeys, inputMethods } from '@/__swaps__/types/swap';
import {
  addCommasToNumber,
  buildQuoteParams,
  clamp,
  countDecimalPlaces,
  findNiceIncrement,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '@/__swaps__/utils/swaps';
import { ExtendedAnimatedAssetWithColors } from '@/__swaps__/types/assets';
import { CrosschainQuote, Quote, QuoteError, SwapType, getCrosschainQuote, getQuote } from '@rainbow-me/swaps';
import { useAnimatedInterval } from '@/hooks/reanimated/useAnimatedInterval';
import store from '@/redux/store';
import { swapsStore } from '@/state/swaps/swapsStore';
import { convertRawAmountToDecimalFormat } from '@/__swaps__/utils/numbers';
import { NavigationSteps } from './useSwapNavigation';
import { RainbowError, logger } from '@/logger';
import {
  EXTERNAL_TOKEN_STALE_TIME,
  ExternalTokenQueryFunctionResult,
  externalTokenQueryKey,
  fetchExternalToken,
} from '@/resources/assets/externalAssetsQuery';
import { ethereumUtils } from '@/utils';
import { queryClient } from '@/react-query';

export function useSwapInputsController({
  focusedInput,
  lastTypedInput,
  inputProgress,
  outputProgress,
  internalSelectedInputAsset,
  internalSelectedOutputAsset,
  isFetching,
  isQuoteStale,
  sliderXPosition,
  quote,
}: {
  focusedInput: SharedValue<inputKeys>;
  lastTypedInput: SharedValue<inputKeys>;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
  internalSelectedInputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  internalSelectedOutputAsset: SharedValue<ExtendedAnimatedAssetWithColors | null>;
  isFetching: SharedValue<boolean>;
  isQuoteStale: SharedValue<number>;
  sliderXPosition: SharedValue<number>;
  quote: SharedValue<Quote | CrosschainQuote | QuoteError | null>;
}) {
  const inputValues = useSharedValue<{ [key in inputKeys]: number | string }>({
    inputAmount: 0,
    inputNativeValue: 0,
    outputAmount: 0,
    outputNativeValue: 0,
  });
  const inputMethod = useSharedValue<inputMethods>('slider');

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const niceIncrement = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value?.balance.amount) return 0.1;
    return findNiceIncrement(Number(internalSelectedInputAsset.value?.balance.amount));
  });
  const incrementDecimalPlaces = useDerivedValue(() => countDecimalPlaces(niceIncrement.value));

  const formattedInputAmount = useDerivedValue(() => {
    if (!internalSelectedInputAsset.value || !internalSelectedInputAsset.value.nativePrice) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputAmount) {
      return '0';
    }

    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount);
    }

    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter({
        amount: inputValues.value.inputAmount,
        usdTokenPrice: internalSelectedInputAsset.value.nativePrice,
        roundingMode: 'up',
        precisionAdjustment: -1,
        isStablecoin: internalSelectedInputAsset.value?.type === 'stablecoin' ?? false,
        stripSeparators: false,
      });
    }

    const balance = Number(internalSelectedInputAsset.value?.balance.amount || 0);

    return niceIncrementFormatter({
      incrementDecimalPlaces: incrementDecimalPlaces.value,
      inputAssetBalance: balance,
      inputAssetUsdPrice: internalSelectedInputAsset.value.nativePrice,
      niceIncrement: niceIncrement.value,
      percentageToSwap: percentageToSwap.value,
      sliderXPosition: sliderXPosition.value,
    });
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.inputNativeValue) {
      return '$0.00';
    }

    const nativeValue = `$${inputValues.value.inputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const formattedOutputAmount = useDerivedValue(() => {
    if (!internalSelectedOutputAsset.value || !internalSelectedOutputAsset.value.nativePrice) return '0';

    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputAmount) {
      return '0';
    }

    if (inputMethod.value === 'outputAmount' || typeof inputValues.value.outputAmount === 'string') {
      return addCommasToNumber(inputValues.value.outputAmount);
    }

    return valueBasedDecimalFormatter({
      amount: inputValues.value.outputAmount,
      usdTokenPrice: internalSelectedOutputAsset.value.nativePrice,
      roundingMode: 'down',
      precisionAdjustment: -1,
      isStablecoin: internalSelectedOutputAsset.value?.type === 'stablecoin' ?? false,
      stripSeparators: false,
    });
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    if ((inputMethod.value === 'slider' && percentageToSwap.value === 0) || !inputValues.value.outputNativeValue) {
      return '$0.00';
    }

    const nativeValue = `$${inputValues.value.outputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const animationFrameId = useRef<number | null>(null);

  const resetTimers = useCallback(() => {
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

  const updateQuoteStore = useCallback((data: Quote | CrosschainQuote | QuoteError | null) => {
    swapsStore.setState({ quote: data });
  }, []);

  const setQuote = useCallback(
    ({
      data,
      outputAmount,
      inputAmount,
    }: {
      data: Quote | CrosschainQuote | QuoteError | null;
      outputAmount?: number;
      inputAmount?: number;
    }) => {
      'worklet';

      // NOTE: Handle updating sliderXPosition based on inputAmount
      if (typeof inputAmount !== 'undefined') {
        if (inputAmount === 0) {
          sliderXPosition.value = withSpring(0, snappySpringConfig);
        } else {
          const inputBalance = Number(internalSelectedInputAsset.value?.balance.amount || '0');
          const updatedSliderPosition = clamp((inputAmount / inputBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);
          if (Number.isNaN(updatedSliderPosition)) {
            sliderXPosition.value = withSpring(0, snappySpringConfig);
          } else {
            sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          }
        }
      }

      isFetching.value = false;
      quote.value = data;
      runOnJS(updateQuoteStore)(data);

      if (!data || (data as QuoteError)?.error) {
        return;
      }

      if (inputAmount) {
        const price = internalSelectedInputAsset.value?.nativePrice || internalSelectedInputAsset.value?.price?.value || 0;
        inputValues.modify(prev => {
          return {
            ...prev,
            inputAmount,
            inputNativeValue: inputAmount * price,
          };
        });
      }

      if (outputAmount) {
        const price = internalSelectedOutputAsset.value?.nativePrice || internalSelectedOutputAsset.value?.price?.value || 0;
        inputValues.modify(prev => {
          return {
            ...prev,
            outputAmount,
            outputNativeValue: outputAmount * price,
          };
        });
      }
    },
    [
      inputValues,
      internalSelectedInputAsset.value?.balance.amount,
      internalSelectedInputAsset.value?.nativePrice,
      internalSelectedInputAsset.value?.price?.value,
      internalSelectedOutputAsset.value?.nativePrice,
      internalSelectedOutputAsset.value?.price?.value,
      isFetching,
      quote,
      sliderXPosition,
      updateQuoteStore,
    ]
  );

  const updateNativePriceForAsset = useCallback(
    ({ price, type }: { price: number; type: string }) => {
      'worklet';

      if (type === 'inputAsset') {
        internalSelectedInputAsset.modify(prev => ({ ...prev, nativePrice: price }));
      } else if (type === 'outputAsset') {
        internalSelectedOutputAsset.modify(prev => ({ ...prev, nativePrice: price }));
      }
    },
    [internalSelectedInputAsset, internalSelectedOutputAsset]
  );

  const getAssetNativePrice = useCallback(
    async ({ asset, type }: { asset: ExtendedAnimatedAssetWithColors | null; type: string }) => {
      if (!asset) return;

      const address = asset.address;
      const network = ethereumUtils.getNetworkFromChainId(asset.chainId);
      const currency = store.getState().settings.nativeCurrency;

      try {
        const tokenData = await fetchExternalToken({
          address,
          network,
          currency,
        });

        if (tokenData?.price.value) {
          queryClient.setQueryData(externalTokenQueryKey({ address, network, currency }), tokenData);
          runOnUI(updateNativePriceForAsset)({
            price: tokenData.price.value,
            type,
          });
        }
      } catch (error) {
        logger.error(new RainbowError('[useSwapInputsController]: get asset prices failed'));

        const now = Date.now();
        const state = queryClient.getQueryState<ExternalTokenQueryFunctionResult>(externalTokenQueryKey({ address, network, currency }));
        const price = state?.data?.price.value;
        if (price) {
          const updatedAt = state.dataUpdatedAt;
          // NOTE: if the data is older than 60 seconds, we need to invalidate it and not use it
          if (now - updatedAt > EXTERNAL_TOKEN_STALE_TIME) {
            queryClient.invalidateQueries(externalTokenQueryKey({ address, network, currency }));
            return;
          }

          runOnUI(updateNativePriceForAsset)({
            price,
            type,
          });
        }
      }
    },
    [updateNativePriceForAsset]
  );

  const fetchAndUpdatePrices = useCallback(
    async ({
      inputAsset,
      outputAsset,
    }: {
      inputAsset: ExtendedAnimatedAssetWithColors | null;
      outputAsset: ExtendedAnimatedAssetWithColors | null;
    }) => {
      return Promise.all(
        [
          {
            asset: inputAsset,
            type: 'inputAsset',
          },
          {
            asset: outputAsset,
            type: 'outputAsset',
          },
        ].map(getAssetNativePrice)
      );
    },
    [getAssetNativePrice]
  );

  const fetchAndUpdateQuote = async ({
    inputAmount,
    outputAmount,
    lastTypedInput,
  }: {
    inputAmount: string | number;
    outputAmount: string | number;
    lastTypedInput: inputKeys;
  }) => {
    const resetFetchingStatus = (fromError = false) => {
      'worklet';
      isQuoteStale.value = 0;
      isFetching.value = false;

      // NOTE: start the quote fetching interval if the token lists aren't open
      // we need this check here because the user can open and close the token list before the quote is fetched and updated
      if (inputProgress.value <= NavigationSteps.INPUT_ELEMENT_FOCUSED && outputProgress.value <= NavigationSteps.INPUT_ELEMENT_FOCUSED) {
        quoteFetchingInterval.start();
      }

      if (!fromError) {
        return;
      }

      // NOTE: if we encounter a quote error, let's make sure to update the outputAmount and inputAmount to 0 accordingly
      if (lastTypedInput === 'inputAmount') {
        inputValues.modify(prev => {
          return {
            ...prev,
            outputAmount: 0,
            outputNativeValue: 0,
          };
        });
      } else if (lastTypedInput === 'outputAmount') {
        inputValues.modify(prev => {
          return {
            ...prev,
            inputAmount: 0,
            inputNativeValue: 0,
          };
        });
      }
    };

    const params = buildQuoteParams({
      currentAddress: store.getState().settings.accountAddress,
      inputAmount,
      outputAmount,
      inputAsset: internalSelectedInputAsset.value,
      outputAsset: internalSelectedOutputAsset.value,
      lastTypedInput,
    });

    logger.debug(`[useSwapInputsController]: quote params`, {
      data: params,
    });

    if (!params) {
      runOnUI(resetFetchingStatus)(true);
      return;
    }

    const response = (params.swapType === SwapType.crossChain ? await getCrosschainQuote(params) : await getQuote(params)) as
      | Quote
      | CrosschainQuote
      | QuoteError;

    logger.debug(`[useSwapInputsController]: quote response`, {
      data: response,
    });

    // TODO: Handle native asset inputs
    runOnUI(setQuote)({
      data: response,
      outputAmount:
        lastTypedInput === 'inputAmount'
          ? Number(
              convertRawAmountToDecimalFormat(
                (response as Quote)?.buyAmountMinusFees?.toString(),
                internalSelectedOutputAsset.value?.decimals || 18
              )
            )
          : undefined,
      inputAmount:
        lastTypedInput === 'outputAmount'
          ? Number(
              convertRawAmountToDecimalFormat((response as Quote)?.sellAmount?.toString(), internalSelectedInputAsset.value?.decimals || 18)
            )
          : undefined,
    });
    runOnUI(resetFetchingStatus)((response as QuoteError)?.error);
  };

  const fetchQuoteAndAssetPrices = () => {
    'worklet';
    // reset the quote data immediately, so we don't use stale data
    setQuote({ data: null });

    const isSomeInputGreaterThanZero = Number(inputValues.value.inputAmount) > 0 || Number(inputValues.value.outputAmount) > 0;

    // If both inputs are 0 or the assets aren't set, return early
    if (!internalSelectedInputAsset.value || !internalSelectedOutputAsset.value || !isSomeInputGreaterThanZero) {
      return;
    }
    isFetching.value = true;

    runOnJS(fetchAndUpdatePrices)({
      inputAsset: internalSelectedInputAsset.value,
      outputAsset: internalSelectedOutputAsset.value,
    });
    runOnJS(fetchAndUpdateQuote)({
      inputAmount: inputValues.value.inputAmount,
      outputAmount: inputValues.value.outputAmount,
      lastTypedInput: lastTypedInput.value,
    });
  };

  const quoteFetchingInterval = useAnimatedInterval({
    intervalMs: 10_000,
    onIntervalWorklet: fetchQuoteAndAssetPrices,
    autoStart: false,
  });

  const onChangedPercentage = useDebouncedCallback((percentage: number, setStale = true) => {
    resetTimers();
    lastTypedInput.value = 'inputAmount';

    if (percentage > 0) {
      if (setStale) isQuoteStale.value = 1;
      runOnUI(fetchQuoteAndAssetPrices)();
    } else {
      isFetching.value = false;
      isQuoteStale.value = 0;
    }

    return () => {
      resetTimers();
    };
  }, 200);

  const onTypedNumber = useDebouncedCallback(async (amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();
    lastTypedInput.value = inputKey;

    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      const updateWorklet = () => {
        'worklet';
        // if the user types in the inputAmount let's optimistically update the slider position
        if (inputKey === 'inputAmount') {
          const inputAssetBalance = Number(internalSelectedInputAsset.value?.balance.amount || '0');
          const updatedSliderPosition = clamp((amount / inputAssetBalance) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

          // Update slider position
          sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
        }

        fetchQuoteAndAssetPrices();
      };

      runOnUI(updateWorklet)();
    } else {
      const resetValuesToZero = () => {
        isFetching.value = false;

        const updateWorklet = () => {
          'worklet';
          const keysToReset = ['inputAmount', 'inputNativeValue', 'outputAmount', 'outputNativeValue'];
          const updatedValues = keysToReset.reduce(
            (acc, key) => {
              const castedKey = key as keyof typeof inputValues.value;
              acc[castedKey] = castedKey === inputKey && preserveAmount ? inputValues.value[castedKey] : 0;
              return acc;
            },
            {} as Partial<typeof inputValues.value>
          );
          inputValues.modify(values => {
            return {
              ...values,
              ...updatedValues,
            };
          });
          sliderXPosition.value = withSpring(0, snappySpringConfig);
          isQuoteStale.value = 0;
          setQuote({ data: null });
          quoteFetchingInterval.stop();
        };

        runOnUI(updateWorklet)();
      };

      animationFrameId.current = requestAnimationFrame(resetValuesToZero);
    }

    return () => {
      resetTimers();
    };
  }, 400);

  // This handles cleaning up typed amounts when the input focus changes
  useAnimatedReaction(
    () => ({ focusedInput: focusedInput.value }),
    (current, previous) => {
      if (previous && current !== previous && typeof inputValues.value[previous.focusedInput] === 'string') {
        const typedValue = inputValues.value[previous.focusedInput].toString();
        if (Number(typedValue) === 0) {
          inputValues.modify(values => {
            return {
              ...values,
              [previous.focusedInput]: 0,
            };
          });
        } else {
          inputValues.modify(values => {
            return {
              ...values,
              [previous.focusedInput]: trimTrailingZeros(typedValue),
            };
          });
        }
      }
    }
  );

  // This handles the updating of input values based on the input method
  useAnimatedReaction(
    () => ({
      sliderXPosition: sliderXPosition.value,
      values: inputValues.value,
      assetToSell: internalSelectedInputAsset.value,
      assetToBuy: internalSelectedOutputAsset.value,
    }),
    (current, previous) => {
      if (
        (!previous?.assetToSell?.uniqueId && current.assetToSell?.uniqueId) ||
        (current.assetToSell && current.assetToSell.uniqueId !== previous?.assetToSell?.uniqueId)
      ) {
        const balance = Number(current.assetToSell.balance.amount);
        if (!balance || !internalSelectedInputAsset.value?.nativePrice) {
          inputValues.modify(values => {
            return {
              ...values,
              inputAmount: 0,
              inputNativeValue: 0,
              outputAmount: 0,
              outputNativeValue: 0,
            };
          });
          return;
        }

        // If the change set the slider position to > 0
        const inputAmount = niceIncrementFormatter({
          incrementDecimalPlaces: incrementDecimalPlaces.value,
          inputAssetBalance: balance,
          inputAssetUsdPrice: internalSelectedInputAsset.value?.nativePrice,
          niceIncrement: niceIncrement.value,
          percentageToSwap: percentageToSwap.value,
          sliderXPosition: sliderXPosition.value,
          stripSeparators: true,
        });
        const inputNativeValue = Number(inputAmount) * internalSelectedInputAsset.value?.nativePrice;
        inputValues.modify(values => {
          return {
            ...values,
            inputAmount,
            inputNativeValue,
          };
        });
      }

      /**
       * The current !== previous check is causing troubles because we're using .modify to add the
       * nativePrice to the inputAsset and outputAsset. This is triggering this useAnimatedReaction
       * and in turn causing the
       */

      if (!previous) {
        // Handle setting of initial values using niceIncrementFormatter,
        // because we will likely set a percentage-based default input value
        if (!current.assetToSell?.nativePrice || !current.assetToBuy?.nativePrice) return;

        const balance = Number(current.assetToSell.balance.amount);
        const inputAmount = niceIncrementFormatter({
          incrementDecimalPlaces: incrementDecimalPlaces.value,
          inputAssetBalance: balance,
          inputAssetUsdPrice: current.assetToSell.nativePrice,
          niceIncrement: niceIncrement.value,
          percentageToSwap: percentageToSwap.value,
          sliderXPosition: sliderXPosition.value,
          stripSeparators: true,
        });

        const inputNativeValue = Number(inputAmount) * current.assetToSell.nativePrice;
        const outputAmount = (inputNativeValue / current.assetToBuy.nativePrice) * (1 - SWAP_FEE); // TODO: Implement swap fee
        const outputNativeValue = outputAmount * current.assetToBuy.nativePrice;

        inputValues.modify(values => {
          return {
            ...values,
            inputAmount,
            inputNativeValue,
            outputAmount,
            outputNativeValue,
          };
        });
      } else if (current !== previous) {
        // Handle updating input values based on the input method
        if (inputMethod.value === 'slider' && current.sliderXPosition !== previous.sliderXPosition) {
          // If the slider position changes
          if (percentageToSwap.value === 0) {
            // If the change set the slider position to 0
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
            isQuoteStale.value = 0;
            setQuote({ data: null });
            quoteFetchingInterval.stop();
          } else {
            if (!current.assetToSell) return;

            const balance = Number(current.assetToSell.balance.amount);
            if (!balance || !current.assetToSell.nativePrice) {
              inputValues.modify(values => {
                return {
                  ...values,
                  inputAmount: 0,
                  inputNativeValue: 0,
                  outputAmount: 0,
                  outputNativeValue: 0,
                };
              });
              return;
            }

            // If the change set the slider position to > 0
            const inputAmount = niceIncrementFormatter({
              incrementDecimalPlaces: incrementDecimalPlaces.value,
              inputAssetBalance: balance,
              inputAssetUsdPrice: current.assetToSell.nativePrice,
              niceIncrement: niceIncrement.value,
              percentageToSwap: percentageToSwap.value,
              sliderXPosition: sliderXPosition.value,
              stripSeparators: true,
            });
            const inputNativeValue = Number(inputAmount) * current.assetToSell.nativePrice;
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount,
                inputNativeValue,
              };
            });

            isQuoteStale.value = 1;
          }
        }
        if (inputMethod.value === 'inputAmount' && Number(current.values.inputAmount) !== Number(previous.values.inputAmount)) {
          // If the number in the input field changes
          if (Number(current.values.inputAmount) === 0) {
            // If the input amount was set to 0
            const hasDecimal = current.values.inputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: hasDecimal ? current.values.inputAmount : 0,
                inputNativeValue: 0,
                outputAmount: 0,
                outputNativeValue: 0,
              };
            });
            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'inputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'inputAmount');
            }
          } else {
            if (!current.assetToSell || !current.assetToSell?.nativePrice) return;
            // If the input amount was set to a non-zero value
            const inputNativeValue = Number(current.values.inputAmount) * current.assetToSell.nativePrice;
            inputValues.modify(values => {
              return {
                ...values,
                inputNativeValue,
              };
            });

            runOnJS(onTypedNumber)(Number(current.values.inputAmount), 'inputAmount', true);
          }
        }
        if (inputMethod.value === 'outputAmount' && Number(current.values.outputAmount) !== Number(previous.values.outputAmount)) {
          // If the number in the output field changes
          if (Number(current.values.outputAmount) === 0) {
            // If the output amount was set to 0
            const hasDecimal = current.values.outputAmount.toString().includes('.');

            sliderXPosition.value = withSpring(0, snappySpringConfig);
            inputValues.modify(values => {
              return {
                ...values,
                inputAmount: 0,
                inputNativeValue: 0,
                outputAmount: hasDecimal ? current.values.outputAmount : 0,
                outputNativeValue: 0,
              };
            });

            isQuoteStale.value = 0;
            setQuote({ data: null });

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'outputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'outputAmount');
            }
          } else if (Number(current.values.outputAmount) > 0) {
            // If the output amount was set to a non-zero value
            if (!current.assetToBuy?.nativePrice) return;

            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * current.assetToBuy.nativePrice;

            inputValues.modify(values => {
              return {
                ...values,
                outputNativeValue,
              };
            });

            runOnJS(onTypedNumber)(Number(current.values.outputAmount), 'outputAmount');
          }
        }
      }

      if (
        current.assetToSell?.uniqueId !== previous?.assetToSell?.uniqueId ||
        current.assetToBuy?.uniqueId !== previous?.assetToBuy?.uniqueId
      ) {
        fetchQuoteAndAssetPrices();
      }
    }
  );

  return {
    formattedInputAmount,
    formattedInputNativeValue,
    formattedOutputAmount,
    formattedOutputNativeValue,
    inputMethod,
    inputValues,
    onChangedPercentage,
    percentageToSwap,
    quoteFetchingInterval,
    fetchQuoteAndAssetPrices,
    setQuote,
  };
}
