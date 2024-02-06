import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from '../icons';
import { borders, shadow } from '@/styles';

function CoinIconIndicator({ theme, style, isPinned }) {
  // this is used inside of FastBalanceCoinRow where we have theme from props
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors, isDarkMode } = theme ?? useTheme();

  const dynamicStyles = {
    ...shadow.buildAsObject(0, 4, 12, isDarkMode ? colors.shadow : colors.blueGreyDark, 0.4),
    backgroundColor: colors.blueGreyDark50,
  };

  const iconStyle = {
    alignSelf: 'center',
    height: isPinned ? 13 : 10,
    marginTop: isPinned ? 1 : 0,
    width: isPinned ? 8 : 14,
  };

  return (
    <View style={[cx.container, dynamicStyles, style]}>
      <Icon color={colors.whiteLabel} name={isPinned ? 'pin' : 'hidden'} style={iconStyle} />
    </View>
  );
}

export default React.memo(CoinIconIndicator);

const cx = StyleSheet.create({
  container: {
    justifyContent: 'center',
    ...borders.buildCircleAsObject(22),
    alignSelf: 'center',
    position: 'absolute',
  },
});
