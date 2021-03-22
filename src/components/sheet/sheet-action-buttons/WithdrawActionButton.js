import analytics from '@segment/analytics-react-native';
import React, { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import { neverRerender } from '../../../utils';
import SheetActionButton from './SheetActionButton';

function WithdrawActionButton({
  color: givenColor,
  symbol,
  token1Address,
  token2Address,
  ...props
}) {
  const { colors, isDarkMode } = useTheme();
  const color = givenColor || (isDarkMode ? colors.darkModeDark : colors.dark);
  const [didTrack, setDidTrack] = useState(false);

  const handlePress = useCallback(() => {
    if (!didTrack) {
      analytics.track('Tapped placeholder Withdraw button', {
        category: 'liquidity pool',
        label: symbol,
      });
      setDidTrack(true);
    }

    Linking.openURL(
      `https://app.uniswap.org/#/remove/${token1Address}/${token2Address}`
    );
  }, [didTrack, symbol, token1Address, token2Address]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label="􀁏 Withdraw"
      onPress={handlePress}
    />
  );
}

export default neverRerender(WithdrawActionButton);
