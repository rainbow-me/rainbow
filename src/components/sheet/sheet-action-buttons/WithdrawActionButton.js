import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { neverRerender } from '../../../utils';
import SheetActionButton from './SheetActionButton';
import { analytics } from '@/analytics';
import { AssetTypes } from '@/entities';

function WithdrawActionButton({
  color: givenColor,
  symbol,
  token1Address,
  token2Address,
  type,
  ...props
}) {
  const { colors, isDarkMode } = useTheme();
  const color = givenColor || (isDarkMode ? colors.darkModeDark : colors.dark);
  const [didTrack, setDidTrack] = useState(false);
  const version = type === AssetTypes.uniswapV2 ? 'v2/' : '';

  const handlePress = useCallback(() => {
    if (!didTrack) {
      analytics.track('Tapped placeholder Withdraw button', {
        category: 'liquidity pool',
        label: symbol,
      });
      setDidTrack(true);
    }

    Linking.openURL(
      `https://app.uniswap.org/#/remove/${version}${token1Address}/${token2Address}`
    );
  }, [didTrack, symbol, token1Address, token2Address, version]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={`􀁏 ${lang.t('pools.withdraw')}`}
      onPress={handlePress}
    />
  );
}

export default neverRerender(WithdrawActionButton);
