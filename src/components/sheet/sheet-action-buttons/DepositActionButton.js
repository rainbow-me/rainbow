import analytics from '@segment/analytics-react-native';
import React, { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import SheetActionButton from './SheetActionButton';
import { AssetTypes } from '@rainbow-me/entities';
import { neverRerender } from '@rainbow-me/utils';

function DepositActionButton({
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
      analytics.track('Tapped placeholder Deposit button', {
        category: 'liquidity pool',
        label: symbol,
      });
      setDidTrack(true);
    }
    Linking.openURL(
      `https://app.uniswap.org/#/add/${version}${token1Address}/${token2Address}`
    );
  }, [didTrack, symbol, token1Address, token2Address, version]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀁍 Deposit"
      onPress={handlePress}
    />
  );
}

export default neverRerender(DepositActionButton);
