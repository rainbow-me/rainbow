import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { Linking } from 'react-native';
import SheetActionButton from './SheetActionButton';
import { neverRerender } from '@rainbow-me/utils';

function DepositActionButton({
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
      analytics.track('Tapped placeholder Deposit button', {
        category: 'liquidity pool',
        label: symbol,
      });
      setDidTrack(true);
    }
    Linking.openURL(
      `https://app.uniswap.org/#/add/${token1Address}/${token2Address}`
    );
  }, [didTrack, symbol, token1Address, token2Address]);

  return (
    <SheetActionButton
      {...props}
      color={color}
      label={`􀁍 ${lang.t('pools.deposit')}`}
      onPress={handlePress}
    />
  );
}

export default neverRerender(DepositActionButton);
