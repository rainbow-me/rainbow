import React from 'react';
import { Centered, ColumnWithMargins } from '../layout';
import { Emoji, Text } from '../text';
import { colors_NOT_REACTIVE } from '@rainbow-me/styles';
import { neverRerender } from '@rainbow-me/utils';

const NoResults = () => (
  <ColumnWithMargins centered margin={3}>
    <Centered>
      <Emoji lineHeight="none" name="ghost" size={42} />
    </Centered>
    <Text
      color={colors_NOT_REACTIVE.alpha(colors_NOT_REACTIVE.blueGreyDark, 0.4)}
      size="lmedium"
      weight="medium"
    >
      Nothing here!
    </Text>
  </ColumnWithMargins>
);

export default neverRerender(NoResults);
