import React from 'react';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import { neverRerender } from '@rainbow-me/utils';

const NoResults = () => {
  const { colors } = useTheme();
  return (
    <ColumnWithMargins centered margin={3}>
      <Centered>
        <Emoji lineHeight="none" name="ghost" size={42} />
      </Centered>
      <Text
        color={colors.alpha(colors.blueGreyDark, 0.4)}
        size="lmedium"
        weight="medium"
      >
        Nothing here!
      </Text>
    </ColumnWithMargins>
  );
};

export default neverRerender(NoResults);
