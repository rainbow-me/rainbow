import analytics from '@segment/analytics-react-native';
import React, { useCallback } from 'react';
import { colors } from '../../../styles';
import { neverRerender } from '../../../utils';
import { ComingSoonFloatingEmojis } from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';

function DepositActionButton({ color = colors.dark, symbol, ...props }) {
  const handlePress = useCallback(() => {
    analytics.track('Tapped placeholder Deposit button', {
      category: 'liquidity pool',
      label: symbol,
    });
  }, [symbol]);

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
