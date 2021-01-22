import analytics from '@segment/analytics-react-native';
import React, { useCallback, useState } from 'react';
import { neverRerender } from '../../../utils';
import { ComingSoonFloatingEmojis } from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';

function WithdrawActionButton({
  color = colors_NOT_REACTIVE.white,
  symbol,
  ...props
}) {
  const [didTrack, setDidTrack] = useState(false);

  const handlePress = useCallback(() => {
    if (!didTrack) {
      analytics.track('Tapped placeholder Withdraw button', {
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
        label="􀁏 Withdraw"
        onPress={handlePress}
        textColor={colors_NOT_REACTIVE.dark}
      />
    </ComingSoonFloatingEmojis>
  );
}

export default neverRerender(WithdrawActionButton);
