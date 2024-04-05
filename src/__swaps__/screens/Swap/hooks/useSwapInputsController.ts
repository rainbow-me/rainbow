import { useCallback, useMemo, useRef } from 'react';
import { SharedValue, runOnJS, runOnUI, useAnimatedReaction, useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { useDebouncedCallback } from 'use-debounce';

import { ETH_COLOR, ETH_COLOR_DARK, SCRUBBER_WIDTH, SLIDER_WIDTH, snappySpringConfig } from '../constants';
import { SWAP_FEE } from '../dummyValues';
import { inputKeys, inputMethods } from '../types/swap';
import {
  addCommasToNumber,
  clamp,
  clampJS,
  countDecimalPlaces,
  extractColorValueForColors,
  findNiceIncrement,
  isUnwrapEth,
  isWrapEth,
  niceIncrementFormatter,
  trimTrailingZeros,
  valueBasedDecimalFormatter,
} from '../utils/swaps';
import { ChainId, ChainName } from '../types/chains';
import { ParsedSearchAsset } from '../types/assets';
import { useColorMode } from '@/design-system';
import { isSameAssetWorklet } from '../utils/assets';
import {
  CrosschainQuote,
  ETH_ADDRESS,
  Quote,
  QuoteError,
  QuoteParams,
  Source,
  SwapType,
  getCrosschainQuote,
  getQuote,
} from '@rainbow-me/swaps';
import { chainNameFromChainIdWorklet } from '../utils/chains';
import { RainbowConfig, useRemoteConfig } from '@/model/remoteConfig';
import { useAccountSettings } from '@/hooks';
import { convertAmountToRawAmount, convertRawAmountToBalance, convertRawAmountToNativeDisplay } from '../utils/numbers';
import ethereumUtils, { getNativeAssetForNetwork } from '@/utils/ethereumUtils';
import { fetchExternalToken } from '@/resources/assets/externalAssetsQuery';

export const DEFAULT_SLIPPAGE_BIPS = {
  [ChainId.mainnet]: 100,
  [ChainId.polygon]: 200,
  [ChainId.bsc]: 200,
  [ChainId.optimism]: 200,
  [ChainId.base]: 200,
  [ChainId.zora]: 200,
  [ChainId.arbitrum]: 200,
  [ChainId.avalanche]: 200,
  [ChainId.blast]: 200,
};

export const DEFAULT_SLIPPAGE = {
  [ChainId.mainnet]: '1',
  [ChainId.polygon]: '2',
  [ChainId.bsc]: '2',
  [ChainId.optimism]: '2',
  [ChainId.base]: '2',
  [ChainId.zora]: '2',
  [ChainId.arbitrum]: '2',
  [ChainId.avalanche]: '2',
  [ChainId.blast]: '2',
};

const slippageInBipsToString = (slippageInBips: number) => {
  'worklet';
  return (slippageInBips / 100).toString();
};

export const getDefaultSlippage = (chainId: ChainId, config: RainbowConfig) => {
  'worklet';

  const chainName = chainNameFromChainIdWorklet(chainId) as
    | ChainName.mainnet
    | ChainName.optimism
    | ChainName.polygon
    | ChainName.arbitrum
    | ChainName.base
    | ChainName.zora
    | ChainName.bsc
    | ChainName.avalanche
    | ChainName.blast;
  return slippageInBipsToString(
    (config.default_slippage_bips as unknown as { [key: string]: number })[chainName] || DEFAULT_SLIPPAGE_BIPS[chainId]
  );
};

export function useSwapInputsController({
  focusedInput,
  isFetching,
  sliderXPosition,
  handleExitSearch,
  handleInputPress,
  handleOutputPress,
  outputProgress,
}: {
  focusedInput: SharedValue<inputKeys>;
  isFetching: SharedValue<boolean>;
  sliderXPosition: SharedValue<number>;
  handleExitSearch: () => void;
  handleFocusInputSearch: () => void;
  handleFocusOutputSearch: () => void;
  handleInputPress: () => void;
  handleOutputPress: () => void;
  inputProgress: SharedValue<number>;
  outputProgress: SharedValue<number>;
}) {
  const { accountAddress: currentAddress, nativeCurrency: currentCurrency } = useAccountSettings();
  const config = useRemoteConfig();
  const { isDarkMode } = useColorMode();
  const assetToSell = useSharedValue<ParsedSearchAsset | null>(null);
  const assetToBuy = useSharedValue<ParsedSearchAsset | null>(null);
  const outputChainId = useSharedValue<ChainId>(ChainId.mainnet);
  const searchQuery = useSharedValue('');

  const quote = useSharedValue<Quote | CrosschainQuote | QuoteError | null>(null);
  const fee = useSharedValue<number | string>(0);
  const source = useSharedValue<Source | 'auto'>('auto');
  const slippage = useSharedValue<string>(getDefaultSlippage(assetToSell.value?.chainId || ChainId.mainnet, config));
  const flashbots = useSharedValue<boolean>(false);

  const sellNativeAsset = useSharedValue(
    getNativeAssetForNetwork(ethereumUtils.getNetworkFromChainId(assetToSell.value?.chainId || ChainId.mainnet))
  );
  const buyNativeAsset = useSharedValue(
    getNativeAssetForNetwork(ethereumUtils.getNetworkFromChainId(assetToBuy.value?.chainId || ChainId.mainnet))
  );

  const inputValues = useSharedValue<{ [key in inputKeys]: number | string }>({
    inputAmount: 0,
    inputNativeValue: 0,
    outputAmount: 0,
    outputNativeValue: 0,
  });
  const inputMethod = useSharedValue<inputMethods>('slider');
  const isQuoteStale = useSharedValue(0);

  const topColor = useDerivedValue(() => {
    return extractColorValueForColors({
      colors: assetToSell.value?.colors,
      isDarkMode,
    });
  });

  const bottomColor = useDerivedValue(() => {
    return extractColorValueForColors({
      colors: assetToBuy.value?.colors,
      isDarkMode,
    });
  });

  const assetToSellSymbol = useDerivedValue(() => {
    return assetToSell.value?.symbol ?? '';
  });

  const assetToSellIconUrl = useDerivedValue(() => {
    return assetToSell.value?.icon_url ?? '';
  });

  const assetToBuySymbol = useDerivedValue(() => {
    return assetToBuy.value?.symbol ?? '';
  });

  const assetToBuyIconUrl = useDerivedValue(() => {
    return assetToBuy.value?.icon_url ?? '';
  });

  const topColorShadow = useDerivedValue(() => {
    return assetToSell.value?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  });

  const bottomColorShadow = useDerivedValue(() => {
    return assetToBuy.value?.colors?.shadow ?? (isDarkMode ? ETH_COLOR_DARK : ETH_COLOR);
  });

  const percentageToSwap = useDerivedValue(() => {
    return Math.round(clamp((sliderXPosition.value - SCRUBBER_WIDTH / SLIDER_WIDTH) / SLIDER_WIDTH, 0, 1) * 100) / 100;
  });

  const niceIncrement = useMemo(() => findNiceIncrement(Number(assetToSell.value?.balance.amount)), [assetToSell]);
  const incrementDecimalPlaces = useMemo(() => countDecimalPlaces(niceIncrement), [niceIncrement]);

  const formattedInputAmount = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '0';
    if (inputMethod.value === 'inputAmount' || typeof inputValues.value.inputAmount === 'string') {
      return addCommasToNumber(inputValues.value.inputAmount);
    }
    if (inputMethod.value === 'outputAmount') {
      return valueBasedDecimalFormatter(
        inputValues.value.inputAmount,
        Number(assetToSell.value?.native.price?.amount),
        'up',
        -1,
        assetToSell.value?.type === 'stablecoin' ?? false,
        false
      );
    }

    return niceIncrementFormatter(
      incrementDecimalPlaces,
      Number(assetToSell.value?.balance.amount),
      Number(assetToSell.value?.native.price?.amount),
      niceIncrement,
      percentageToSwap.value,
      sliderXPosition.value
    );
  });

  const formattedInputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0 && !inputValues.value.inputNativeValue) return '$0.00';

    const nativeValue = `$${inputValues.value.inputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const formattedOutputAmount = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0) return '0';

    if (inputMethod.value === 'outputAmount' || typeof inputValues.value.outputAmount === 'string') {
      return addCommasToNumber(inputValues.value.outputAmount);
    }

    return valueBasedDecimalFormatter(
      inputValues.value.outputAmount,
      Number(assetToBuy.value?.native.price?.amount),
      'down',
      -1,
      assetToBuy.value?.type === 'stablecoin' ?? false,
      false
    );
  });

  const formattedOutputNativeValue = useDerivedValue(() => {
    if (inputMethod.value === 'slider' && percentageToSwap.value === 0 && !inputValues.value.outputNativeValue) return '$0.00';

    const nativeValue = `$${inputValues.value.outputNativeValue.toLocaleString('en-US', {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

    return nativeValue || '$0.00';
  });

  const spinnerTimer = useRef<NodeJS.Timeout | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const resetTimers = useCallback(() => {
    if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    if (animationFrameId.current !== null) cancelAnimationFrame(animationFrameId.current);
  }, []);

  const onChangedPercentage = useDebouncedCallback((percentage: number, setStale = true) => {
    resetTimers();

    const updateValues = () => {
      isFetching.value = false;
      if (!assetToSell.value || !assetToBuy.value) return;

      const inputNativeValue = percentage * Number(assetToSell.value.balance.amount) * Number(assetToSell.value.native.price?.amount);
      const outputAmount = (inputNativeValue / Number(assetToBuy.value?.native.price?.amount)) * (1 - SWAP_FEE);
      const outputNativeValue = outputAmount * Number(assetToBuy.value?.native.price?.amount);

      const updateWorklet = () => {
        'worklet';
        inputValues.modify(values => {
          return {
            ...values,
            outputAmount,
            outputNativeValue,
          };
        });
        isQuoteStale.value = 0;
      };

      runOnUI(updateWorklet)();
    };

    if (percentage > 0) {
      if (setStale) isQuoteStale.value = 1;
      isFetching.value = true;
      spinnerTimer.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(updateValues);
      }, 600);
    } else {
      isFetching.value = false;
      isQuoteStale.value = 0;
    }

    return () => {
      resetTimers();
    };
  }, 200);

  const onTypedNumber = useDebouncedCallback((amount: number, inputKey: inputKeys, preserveAmount = true, setStale = true) => {
    resetTimers();

    const updateValues = async () => {
      isFetching.value = true;
      if (inputKey === 'inputAmount') {
        if (!assetToSell.value || !assetToBuy.value) return;

        const isCrosschainSwap = assetToSell.value.chainId !== assetToBuy.value.chainId;

        console.log({ isCrosschainSwap });

        const quoteParams: QuoteParams = {
          source: source.value === 'auto' ? undefined : source.value,
          chainId: assetToSell.value.chainId,
          fromAddress: currentAddress,
          sellTokenAddress: assetToSell.value.isNativeAsset ? ETH_ADDRESS : assetToSell.value.address,
          buyTokenAddress: assetToBuy.value.isNativeAsset ? ETH_ADDRESS : assetToBuy.value.address,
          sellAmount: convertAmountToRawAmount(amount, assetToSell.value.decimals),
          buyAmount: undefined,
          slippage: Number(slippage.value),
          refuel: false,
          swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
          toChainId: isCrosschainSwap ? assetToBuy.value.chainId : assetToSell.value.chainId,
        };

        console.log(quoteParams);

        const quoteResponse = (isCrosschainSwap ? await getCrosschainQuote(quoteParams) : await getQuote(quoteParams)) as
          | Quote
          | CrosschainQuote
          | QuoteError;

        const assetToBuyWithPriceData = await fetchExternalToken({
          address: assetToBuy.value.address,
          network: ethereumUtils.getNetworkFromChainId(assetToBuy.value.chainId),
          currency: currentCurrency,
        });

        const assetToSellWithPriceData = await fetchExternalToken({
          address: assetToSell.value.address,
          network: ethereumUtils.getNetworkFromChainId(assetToSell.value.chainId),
          currency: currentCurrency,
        });

        console.log(JSON.stringify(quoteResponse, null, 2));

        // const updatedSliderPosition = clampJS((amount / Number(assetToSell.value.balance.amount)) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

        const updateWorklet = ({
          quote,
          inputNativeValue,
          outputAmount,
          outputNativeValue,
          isWrapOrUnwrapEth,
        }: {
          quote: Quote | CrosschainQuote;
          inputNativeValue: string;
          outputAmount: string;
          outputNativeValue: string;
          isWrapOrUnwrapEth: boolean;
        }) => {
          'worklet';
          if (quote.source) {
            source.value = quote.source;
          }

          // TODO: Need to convert big number to native value properly here...
          // example: "fee": "3672850000000000",
          fee.value = isWrapOrUnwrapEth ? '0' : quote.feeInEth.toString();

          inputValues.modify(values => {
            return {
              ...values,
              outputAmount,
              outputNativeValue,
              inputNativeValue,
            };
          });
          // TODO: Bring back in slider position change
          // sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          isQuoteStale.value = 0;
        };

        quote.value = quoteResponse;
        isFetching.value = false;

        if (!quoteResponse || (quoteResponse as QuoteError)?.error) return;

        const data = quoteResponse as Quote | CrosschainQuote;

        const isWrapOrUnwrapEth =
          isWrapEth({
            buyTokenAddress: data.buyTokenAddress,
            sellTokenAddress: data.sellTokenAddress,
            chainId: assetToSell.value.chainId,
          }) ||
          isUnwrapEth({
            buyTokenAddress: data.buyTokenAddress,
            sellTokenAddress: data.sellTokenAddress,
            chainId: assetToSell.value.chainId,
          });

        const outputAmount = convertRawAmountToBalance(data.buyAmount.toString(), { decimals: assetToBuy.value.decimals || 18 }).amount;
        const outputNativeValue =
          !data.buyAmount || !assetToBuyWithPriceData?.price.value
            ? '0.00'
            : convertRawAmountToNativeDisplay(
                data.buyAmount.toString(),
                assetToBuy.value.decimals || 18,
                assetToBuyWithPriceData.price.value,
                currentCurrency
              ).display.slice(1);

        const inputNativeValue =
          !data.sellAmount || !assetToSellWithPriceData?.price.value
            ? '0.00'
            : convertRawAmountToNativeDisplay(
                data.sellAmount.toString(),
                assetToSell.value.decimals || 18,
                assetToSellWithPriceData.price.value,
                currentCurrency
              ).display.slice(1);

        runOnUI(updateWorklet)({
          quote: data,
          outputAmount,
          outputNativeValue,
          inputNativeValue,
          isWrapOrUnwrapEth,
        });
      } else if (inputKey === 'outputAmount') {
        if (!assetToSell.value || !assetToBuy.value) return;

        const isCrosschainSwap = assetToSell.value.chainId !== assetToBuy.value.chainId;

        const quoteParams: QuoteParams = {
          source: source.value === 'auto' ? undefined : source.value,
          chainId: assetToSell.value.chainId,
          fromAddress: currentAddress,
          sellTokenAddress: assetToSell.value.isNativeAsset ? ETH_ADDRESS : assetToSell.value.address,
          buyTokenAddress: assetToBuy.value.isNativeAsset ? ETH_ADDRESS : assetToBuy.value.address,
          sellAmount: undefined,
          buyAmount: convertAmountToRawAmount(amount, assetToBuy.value.decimals),
          slippage: Number(slippage.value),
          refuel: false,
          swapType: isCrosschainSwap ? SwapType.crossChain : SwapType.normal,
          toChainId: isCrosschainSwap ? assetToBuy.value.chainId : assetToSell.value.chainId,
        };

        const quoteResponse = (isCrosschainSwap ? await getCrosschainQuote(quoteParams) : await getQuote(quoteParams)) as
          | Quote
          | CrosschainQuote
          | QuoteError;

        const assetToBuyWithPriceData = await fetchExternalToken({
          address: assetToBuy.value.address,
          network: ethereumUtils.getNetworkFromChainId(assetToBuy.value.chainId),
          currency: currentCurrency,
        });

        const assetToSellWithPriceData = await fetchExternalToken({
          address: assetToSell.value.address,
          network: ethereumUtils.getNetworkFromChainId(assetToSell.value.chainId),
          currency: currentCurrency,
        });

        console.log(JSON.stringify(quoteResponse, null, 2));

        // TODO: Bring back in slider position change
        // const updatedSliderPosition = clampJS((inputAmount / Number(assetToSell.value.balance.amount)) * SLIDER_WIDTH, 0, SLIDER_WIDTH);

        const updateWorklet = ({
          quote,
          inputAmount,
          inputNativeValue,
          outputNativeValue,
          isWrapOrUnwrapEth,
        }: {
          quote: Quote | CrosschainQuote;
          inputAmount: string;
          inputNativeValue: string;
          outputNativeValue: string;
          isWrapOrUnwrapEth: boolean;
        }) => {
          'worklet';
          if (quote.source) {
            source.value = quote.source;
          }

          // TODO: Need to convert big number to native value properly here...
          // example: "fee": "3672850000000000",
          fee.value = isWrapOrUnwrapEth ? '0' : quote.feeInEth.toString();

          inputValues.modify(values => {
            return {
              ...values,
              inputAmount,
              inputNativeValue,
              outputNativeValue,
            };
          });
          // TODO: Bring back in slider position change
          // sliderXPosition.value = withSpring(updatedSliderPosition, snappySpringConfig);
          isQuoteStale.value = 0;
        };

        quote.value = quoteResponse;
        isFetching.value = false;

        if (!quoteResponse || (quoteResponse as QuoteError)?.error) return;

        const data = quoteResponse as Quote | CrosschainQuote;

        const isWrapOrUnwrapEth =
          isWrapEth({
            buyTokenAddress: data.buyTokenAddress,
            sellTokenAddress: data.sellTokenAddress,
            chainId: assetToSell.value.chainId,
          }) ||
          isUnwrapEth({
            buyTokenAddress: data.buyTokenAddress,
            sellTokenAddress: data.sellTokenAddress,
            chainId: assetToSell.value.chainId,
          });

        const inputAmount = convertRawAmountToBalance(data.sellAmount.toString(), { decimals: assetToSell.value.decimals || 18 }).amount;
        const inputNativeValue =
          !data.sellAmount || !assetToSellWithPriceData?.price.value
            ? '0.00'
            : convertRawAmountToNativeDisplay(
                data.sellAmount.toString(),
                assetToSell.value.decimals || 18,
                assetToSellWithPriceData.price.value,
                currentCurrency
              ).display.slice(1);

        const outputNativeValue =
          !data.buyAmount || !assetToBuyWithPriceData?.price.value
            ? '0.00'
            : convertRawAmountToNativeDisplay(
                data.buyAmount.toString(),
                assetToBuy.value.decimals || 18,
                assetToBuyWithPriceData.price.value,
                currentCurrency
              ).display.slice(1);

        runOnUI(updateWorklet)({
          quote: data,
          inputAmount,
          inputNativeValue,
          outputNativeValue,
          isWrapOrUnwrapEth,
        });
      }
    };

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
      };

      runOnUI(updateWorklet)();
    };

    if (amount > 0) {
      if (setStale) isQuoteStale.value = 1;
      isFetching.value = true;
      spinnerTimer.current = setTimeout(() => {
        animationFrameId.current = requestAnimationFrame(updateValues);
      }, 600);
    } else {
      animationFrameId.current = requestAnimationFrame(resetValuesToZero);
    }

    return () => {
      resetTimers();
    };
  }, 400);

  const onChangeSearchQuery = (text: string) => {
    'worklet';
    searchQuery.value = text;
  };

  const onSetAssetToSell = (parsedAsset: ParsedSearchAsset) => {
    'worklet';
    // if the user has an asset to buy selected and the asset to sell is the same, we need to clear the asset to buy
    if (assetToBuy.value && isSameAssetWorklet(assetToBuy.value, parsedAsset)) {
      assetToBuy.value = null;
    }

    assetToSell.value = parsedAsset;
    if (!assetToBuy.value) {
      outputChainId.value = parsedAsset.chainId;
    }

    inputValues.modify(values => {
      return {
        ...values,
        inputNativeValue: Number(values.inputAmount) * Number(assetToSell.value?.native.price?.amount),
      };
    });

    // if the user doesn't have an asset to buy selected, let's open that list
    if (!assetToBuy.value) {
      handleOutputPress();
    } else {
      handleInputPress();
    }
  };

  const onSetAssetToBuy = (parsedAsset: ParsedSearchAsset) => {
    'worklet';
    assetToBuy.value = parsedAsset;
    if (assetToSell.value && isSameAssetWorklet(assetToSell.value, parsedAsset)) {
      assetToSell.value = null;
      handleInputPress();
      handleExitSearch();
    } else {
      handleOutputPress();
      handleExitSearch();
    }
  };

  const onSwapAssets = () => {
    'worklet';

    const prevAssetToSell = assetToSell.value;
    const prevAssetToBuy = assetToBuy.value;

    if (prevAssetToSell) {
      assetToBuy.value = prevAssetToSell;
      outputChainId.value = prevAssetToSell.chainId;
    } else {
      assetToBuy.value = null;
    }

    if (prevAssetToBuy) {
      assetToSell.value = prevAssetToBuy;
      outputChainId.value = prevAssetToBuy.chainId;
    } else {
      assetToSell.value = null;
    }

    // TODO: if !prevAssetToBuy => focus assetToSell input
    // TODO: if !prevAssetToSell => focus assetToBuy input

    // TODO: Need to refetch the quote here too

    if (outputProgress.value === 1) {
      handleOutputPress();
    }
  };

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
    },
    []
  );

  // This handles the updating of input values based on the input method
  useAnimatedReaction(
    () => ({ sliderXPosition: sliderXPosition.value, values: inputValues.value }),
    (current, previous) => {
      if (!previous) {
        // Handle setting of initial values using niceIncrementFormatter,
        // because we will likely set a percentage-based default input value
        if (!assetToSell.value || !assetToBuy.value) return;

        const inputAmount = niceIncrementFormatter(
          incrementDecimalPlaces,
          Number(assetToSell.value.balance.amount),
          Number(assetToSell.value.native.price?.amount),
          niceIncrement,
          percentageToSwap.value,
          sliderXPosition.value,
          true
        );
        const inputNativeValue = Number(inputAmount) * Number(assetToSell.value.native.price?.amount);
        const outputAmount = (inputNativeValue / Number(assetToBuy.value.native.price?.amount)) * (1 - SWAP_FEE);
        const outputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount);

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
          } else {
            if (!assetToSell.value) return;
            // If the change set the slider position to > 0
            const inputAmount = niceIncrementFormatter(
              incrementDecimalPlaces,
              Number(assetToSell.value.balance.amount),
              Number(assetToSell.value.native.price?.amount),
              niceIncrement,
              percentageToSwap.value,
              sliderXPosition.value,
              true
            );
            const inputNativeValue = Number(inputAmount) * Number(assetToSell.value.native.price?.amount);

            inputValues.modify(values => {
              return {
                ...values,
                inputAmount,
                inputNativeValue,
              };
            });
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
            isQuoteStale.value = 0;

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'inputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'inputAmount');
            }
          } else {
            if (!assetToSell.value) return;
            // If the input amount was set to a non-zero value
            const inputNativeValue = Number(current.values.inputAmount) * Number(assetToSell.value.native.price?.amount);

            isQuoteStale.value = 1;
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

            if (hasDecimal) {
              runOnJS(onTypedNumber)(0, 'outputAmount', true);
            } else {
              runOnJS(onTypedNumber)(0, 'outputAmount');
            }
          } else if (Number(current.values.outputAmount) > 0) {
            // If the output amount was set to a non-zero value
            if (!assetToBuy.value) return;

            const outputAmount = Number(current.values.outputAmount);
            const outputNativeValue = outputAmount * Number(assetToBuy.value.native.price?.amount);

            isQuoteStale.value = 1;
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
    },
    []
  );

  useAnimatedReaction(
    () => ({
      assetToSellChainId: assetToSell.value?.chainId || ChainId.mainnet,
      assetToBuyChainId: assetToBuy.value?.chainId || ChainId.mainnet,
    }),
    (current, previous) => {
      if (current.assetToSellChainId !== previous?.assetToSellChainId) {
        slippage.value = getDefaultSlippage(current.assetToSellChainId, config);
        // TODO: Convert this to a worklet func
        // sellNativeAsset.value = runOnJS(getNativeAssetForNetwork)(ethereumUtils.getNetworkFromChainId(current.assetToSellChainId));
      }

      if (current.assetToBuyChainId !== previous?.assetToBuyChainId) {
        // buyNativeAsset.value = getNativeAssetForNetwork(ethereumUtils.getNetworkFromChainId(current.assetToBuyChainId));
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
    searchQuery,
    assetToSell,
    assetToBuy,
    assetToSellSymbol,
    assetToSellIconUrl,
    assetToBuySymbol,
    assetToBuyIconUrl,
    source,
    slippage,
    flashbots,
    topColor,
    bottomColor,
    topColorShadow,
    bottomColorShadow,
    outputChainId,
    isQuoteStale,
    onChangedPercentage,
    percentageToSwap,
    onSetAssetToSell,
    onSetAssetToBuy,
    onSwapAssets,
    onChangeSearchQuery,
  };
}
