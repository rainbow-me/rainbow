import React, { useCallback, useMemo } from 'react';

import { navigateToSwaps } from '@/__swaps__/screens/Swap/navigateToSwaps';
import { SwapAssetType } from '@/__swaps__/types/swap';
import { transformRainbowTokenToParsedSearchAsset } from '@/__swaps__/utils/assets';
import { Inline, Text, TextIcon } from '@/design-system';
import type { RainbowToken } from '@/entities/tokens';
import { containsEmoji } from '@/helpers/strings';
import * as i18n from '@/languages';
import { useTheme } from '@/theme/ThemeContext';

import SheetActionButton from './SheetActionButton';

type SwapActionButtonProps = {
  asset: RainbowToken;
  color: string;
  height?: number;
  icon?: string;
  inputType: SwapAssetType;
  textColor?: string;
  label?: string;
  /**
   * Identifies the swap entry point, e.g. the buy/sell pair on the expanded asset
   * sheet footer. Rendered by SheetActionButton as `${testID}-action-button`.
   */
  testID: string;
  weight?: string;
};

function SwapActionButton({
  asset,
  color: givenColor,
  height,
  icon,
  inputType,
  label,
  testID,
  weight = 'heavy',
  ...props
}: SwapActionButtonProps) {
  const { colors } = useTheme();

  const color = givenColor || colors.swapPurple;
  const symbolHasEmoji = useMemo(() => (label ? containsEmoji(label) : false), [label]);

  const goToSwap = useCallback(() => {
    const parsedAsset = transformRainbowTokenToParsedSearchAsset(asset);
    navigateToSwaps(inputType === SwapAssetType.inputAsset ? { inputAsset: parsedAsset } : { outputAsset: parsedAsset });
  }, [asset, inputType]);

  return (
    <SheetActionButton
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      color={color}
      newShadows
      onPress={goToSwap}
      size={height}
      testID={testID}
      weight={weight}
      truncate
    >
      {icon ? (
        <Inline alignHorizontal="center" alignVertical="center" space="10px">
          <TextIcon color="label" size="icon 18px" weight="heavy">
            {icon}
          </TextIcon>
          <Text align="center" color="label" containsEmoji={symbolHasEmoji} numberOfLines={1} size="20pt" weight="heavy">
            {label || `${i18n.t(i18n.l.button.swap)}`}
          </Text>
        </Inline>
      ) : (
        <Text align="center" color="label" containsEmoji={symbolHasEmoji} numberOfLines={1} size="20pt" weight="heavy">
          {label || `${i18n.t(i18n.l.button.swap)}`}
        </Text>
      )}
    </SheetActionButton>
  );
}

export default React.memo(SwapActionButton);
