import React, { createElement } from 'react';
import styled from 'styled-components';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ExchangeFab' was resolved to '/Users/nic... Remove this comment to see the full error message
import ExchangeFab from './ExchangeFab';
// @ts-expect-error ts-migrate(6142) FIXME: Module './SendFab' was resolved to '/Users/nickbyt... Remove this comment to see the full error message
import SendFab from './SendFab';

export const FabWrapperBottomPosition = 21 + safeAreaInsetValues.bottom;
export const FabWrapperItemMargin = 15;

const FabWrapperRow = styled(RowWithMargins).attrs({ margin: 13 })`
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
}: any) {
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <FlexItem>
      {children}
      {!disabled && (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <FabWrapperRow isEditMode={isCoinListEdited} pointerEvents="box-none">
          {fabs.map(renderFab)}
        </FabWrapperRow>
      )}
    </FlexItem>
  );
}
