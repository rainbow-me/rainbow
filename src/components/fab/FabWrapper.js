import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import styled from 'styled-components/primitives';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import ExchangeFab from './ExchangeFab';
import SendFab from './SendFab';

const bottomPosition = 21 + safeAreaInsetValues.bottom;

const FabWrapperRow = styled(RowWithMargins).attrs({
  margin: 12,
})`
  bottom: ${({ isEditMode }) => (isEditMode ? -60 : bottomPosition)};
  position: absolute;
  right: 15;
  z-index: 2;
`;

const FabWrapper = ({
  children,
  disabled,
  fabs,
  isCoinListEdited,
  isReadOnlyWallet,
  ...props
}) => (
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

FabWrapper.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  fabs: PropTypes.arrayOf(PropTypes.func).isRequired,
  isCoinListEdited: PropTypes.bool,
  isReadOnlyWallet: PropTypes.bool,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

FabWrapper.defaultProps = {
  fabs: [ExchangeFab, SendFab],
};

FabWrapper.bottomPosition = bottomPosition;

export default FabWrapper;
