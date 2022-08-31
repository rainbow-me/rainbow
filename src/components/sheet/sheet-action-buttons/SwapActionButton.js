import lang from 'i18n-js';
import React, { useCallback } from 'react';
import SheetActionButton from './SheetActionButton';
import { CurrencySelectionTypes, ExchangeModalTypes } from '@/helpers';
import AssetInputTypes from '@/helpers/assetInputTypes';
import { useExpandedStateNavigation, useSwapCurrencyHandlers } from '@/hooks';
import Routes from '@/navigation/routesNames';
import { ethereumUtils } from '@/utils';

function SwapActionButton({
  asset,
  color: givenColor,
  inputType,
  label,
  weight = 'heavy',
  ...props
}) {
  const { colors } = useTheme();
  const color = givenColor || colors.swapPurple;

  const { updateInputCurrency, updateOutputCurrency } = useSwapCurrencyHandlers(
    {
      defaultInputAsset: inputType === AssetInputTypes.in ? asset : null,
      defaultOutputAsset: inputType === AssetInputTypes.out ? asset : null,
      shouldUpdate: true,
      type: ExchangeModalTypes.swap,
    }
  );

  const navigate = useExpandedStateNavigation(inputType);
  const goToSwap = useCallback(() => {
    navigate(Routes.EXCHANGE_MODAL, params => {
      if (params.outputAsset) {
        return {
          params: {
            chainId: ethereumUtils.getChainIdFromType(asset.type),
            defaultOutputAsset: asset,
            fromDiscover: true,
            onSelectCurrency: updateInputCurrency,
            params: {
              ...params,
              ignoreInitialTypeCheck: true,
              outputAsset: asset,
            },
            showCoinIcon: true,
            title: lang.t('swap.modal_types.get_symbol_with', {
              symbol: params?.outputAsset?.symbol,
            }),
            type: CurrencySelectionTypes.input,
          },
          screen: Routes.CURRENCY_SELECT_SCREEN,
        };
      } else {
        return {
          params: {
            chainId: ethereumUtils.getChainIdFromType(asset.type),
            defaultInputAsset: asset,
            onSelectCurrency: updateOutputCurrency,
            params: {
              ...params,
              ignoreInitialTypeCheck: true,
            },
            title: lang.t('swap.modal_types.receive'),
            type: CurrencySelectionTypes.output,
          },
          screen: Routes.CURRENCY_SELECT_SCREEN,
        };
      }
    });
  }, [asset, navigate, updateInputCurrency, updateOutputCurrency]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={label || `􀖅 ${lang.t('button.swap')}`}
      onPress={goToSwap}
      testID="swap"
      weight={weight}
    />
  );
}

export default React.memo(SwapActionButton);
