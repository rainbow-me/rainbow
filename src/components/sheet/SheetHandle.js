import React from 'react';
import { View } from 'react-primitives';
import { colors } from '../../styles';

const SheetHandle = () => (
  <View
    backgroundColor={colors.alpha(colors.blueGreyDark, 0.3)}
    borderRadius={3}
    height={5}
    width={36}
  />
);

const neverRerender = () => true;
export default React.memo(SheetHandle, neverRerender);
