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
            defaultOutputAsset: asset,
            params: {
              outputAsset: asset,
            },
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        };
      } else {
        console.log(asset);
        return {
          params: {
            defaultInputAsset: asset,
          },
          screen: Routes.MAIN_EXCHANGE_SCREEN,
        };
      }
    });
  }, [asset, navigate]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={label || `􀖅 ${lang.t('button.swap')}`}
      onPress={goToSwap}
      testID="swap"
      weight={weight}
      truncate
    />
  );
}

export default React.memo(SwapActionButton);
