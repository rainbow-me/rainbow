import React, { createElement } from 'react';
import { useWindowDimensions } from 'react-native';
import styled from 'styled-components';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import ExchangeFab from './ExchangeFab';
import { FloatingActionButtonSize } from './FloatingActionButton';
import SendFab from './SendFab';

export const FabWrapperBottomPosition = 21 + safeAreaInsetValues.bottom;
export const FabWrapperItemMargin = 15;

const FabWrapperRow = styled(RowWithMargins).attrs({ margin: 12 })`
  bottom: ${({ isEditMode }) => (isEditMode ? -60 : FabWrapperBottomPosition)};
  position: absolute;
  right: ${FabWrapperItemMargin};
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
  const { width } = useWindowDimensions();
  const renderFab = React.useCallback(
    (fab, index, fabs) => {
      const numberOfSurroundingFabs = Math.max(fabs.length - 1, 0);
      // Calculate the gap left after it has been consumed up by other Fabs,
      // taking care to remove screen padding.
      const maybeScreenLeftPadding = 10; // TODO: Where is this defined?
      const remainingSpace =
        index === 0
          ? width -
            (numberOfSurroundingFabs *
              (FloatingActionButtonSize + FabWrapperItemMargin) +
              maybeScreenLeftPadding)
          : 0;
      const id = `${index}`;
      return createElement(fab, {
        isReadOnlyWallet,
        key: `fab-${id}`,
        ...props,
        remainingSpace,
      });
    },
    [props, isReadOnlyWallet, width]
  );
  return (
    <FlexItem>
      {children}
      {!disabled && (
        <FabWrapperRow isEditMode={isCoinListEdited}>
          {fabs.map(renderFab)}
        </FabWrapperRow>
      )}
    </FlexItem>
  );
}
