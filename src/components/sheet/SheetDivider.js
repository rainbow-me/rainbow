import React from 'react';
import { colors } from '../../styles';
import Divider from '../Divider';

const SheetDivider = () => (
  <Divider color={colors.rowDividerLight} zIndex={1} />
);

const neverRerender = () => true;
export default React.memo(SheetDivider, neverRerender);
