import analytics from '@segment/analytics-react-native';
import lang from 'i18n-js';
import React, { useCallback, useState } from 'react';
import { neverRerender } from '../../../utils';
import { ComingSoonFloatingEmojis } from '../../floating-emojis';
import SheetActionButton from './SheetActionButton';
import { colors } from '@rainbow-me/styles';

function WithdrawActionButton({ color = colors.white, symbol, ...props }) {
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
        label={`􀁏 ${lang.t('pools.withdraw')}`}
        onPress={handlePress}
        textColor={colors.dark}
      />
    </ComingSoonFloatingEmojis>
  );
}

export default neverRerender(WithdrawActionButton);
