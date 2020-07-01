import React from 'react';
import Divider from '../Divider';
import { colors } from '@rainbow-me/styles';

const SheetDivider = () => (
  <Divider color={colors.rowDividerLight} zIndex={1} />
);

const neverRerender = () => true;
export default React.memo(SheetDivider, neverRerender);
