import analytics from '@segment/analytics-react-native';
import React, { useCallback, useState } from 'react';
import { ComingSoonFloatingEmojis } from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';
import { colors } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

function DepositActionButton({ color = colors.dark, symbol, ...props }) {
  const [didTrack, setDidTrack] = useState(false);

  const handlePress = useCallback(() => {
    if (!didTrack) {
      analytics.track('Tapped placeholder Deposit button', {
        category: 'liquidity pool',
        label: symbol,
      });
      setDidTrack(true);
    }
  }, [didTrack, symbol]);

  return (
    <ComingSoonFloatingEmojis>
      <SheetActionButton
        {...props}
        color={color}
        label="􀁍 Deposit"
        onPress={handlePress}
      />
    </ComingSoonFloatingEmojis>
  );
}

export default neverRerender(DepositActionButton);
