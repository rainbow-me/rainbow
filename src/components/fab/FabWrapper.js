import React, { createElement } from 'react';
import styled from 'styled-components/primitives';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import ExchangeFab from './ExchangeFab';
import SendFab from './SendFab';

export const FabWrapperBottomPosition = 21 + safeAreaInsetValues.bottom;

const FabWrapperRow = styled(RowWithMargins).attrs({ margin: 12 })`
  bottom: ${({ isEditMode }) => (isEditMode ? -60 : FabWrapperBottomPosition)};
  position: absolute;
  right: 15;
  z-index: 2;
`;

export default function FabWrapper({
  children,
  disabled,
  fabs = [ExchangeFab, SendFab],
  isCoinListEdited,
  isReadOnlyWallet,
  ...props
}) {
  return (
    <FlexItem>
      {children}
      {!disabled && (
        <FabWrapperRow isEditMode={isCoinListEdited}>
          {fabs.map((fab, id) =>
            createElement(fab, {
              isReadOnlyWallet,
              key: `fab-${id}`,
              ...props,
            })
          )}
        </FabWrapperRow>
      )}
    </FlexItem>
  );
}
