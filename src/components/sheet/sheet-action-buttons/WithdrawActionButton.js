import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { colors } from '../../../styles';
import { neverRerender } from '../../../utils';
import { ComingSoonFloatingEmojis } from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';

function WithdrawActionButton({ color = colors.white, symbol, ...props }) {
  const handlePress = useCallback(() => {
    analytics.track('Tapped placeholder Withdraw button', {
      category: 'liquidity pool',
      label: symbol,
    });
  }, [symbol]);

  return (
    <ComingSoonFloatingEmojis>
      <SheetActionButton
        {...props}
        color={color}
        label="􀁏 Withdraw"
        onPress={handlePress}
        textColor={colors.dark}
      />
    </ComingSoonFloatingEmojis>
  );
}

export default neverRerender(WithdrawActionButton);
