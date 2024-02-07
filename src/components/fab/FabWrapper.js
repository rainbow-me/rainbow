import React, { createElement } from 'react';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import ExchangeFab from './ExchangeFab';
import SendFab from './SendFab';
import styled from '@/styled-thing';

export const FabWrapperBottomPosition = 21 + safeAreaInsetValues.bottom;
export const FabWrapperItemMargin = 15;

const FabWrapperRow = styled(RowWithMargins).attrs({ margin: 13 })({
  bottom: ({ isEditMode }) => (isEditMode ? -60 : FabWrapperBottomPosition),
  position: 'absolute',
  right: FabWrapperItemMargin,
  zIndex: 2,
});

export default function FabWrapper({ children, disabled, fabs = [ExchangeFab, SendFab], isCoinListEdited, isReadOnlyWallet, ...props }) {
  const renderFab = React.useCallback(
    (fab, index) => {
      const id = `${index}`;
      return createElement(fab, {
        isReadOnlyWallet,
        key: `fab-${id}`,
        ...props,
      });
    },
    [props, isReadOnlyWallet]
  );
  return (
    <FlexItem>
      {children}
      {!disabled && (
        <FabWrapperRow isEditMode={isCoinListEdited} pointerEvents="box-none">
          {fabs.map(renderFab)}
        </FabWrapperRow>
      )}
    </FlexItem>
  );
}
