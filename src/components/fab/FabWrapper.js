import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import ExchangeFab from './ExchangeFab';
import SendFab from './SendFab';

const bottomPosition = 21 + safeAreaInsetValues.bottom;

const enhance = onlyUpdateForKeys(['children', 'disabled', 'isCoinListEdited']);
const FabWrapper = enhance(
  ({ children, disabled, fabs, isCoinListEdited, ...props }) => (
    <FlexItem>
      {children}
      {!disabled && (
        <RowWithMargins
          bottom={isCoinListEdited ? -60 : bottomPosition}
          css={`
            position: absolute;
            right: 15;
            z-index: 2;
          `}
          direction="row-reverse"
          margin={12}
        >
          {fabs.map((fab, id) =>
            createElement(fab, { key: `fab-${id}`, ...props })
          )}
        </RowWithMargins>
      )}
    </FlexItem>
  )
);

FabWrapper.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  fabs: PropTypes.arrayOf(PropTypes.func).isRequired,
  isCoinListEdited: PropTypes.bool,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

FabWrapper.defaultProps = {
  fabs: [ExchangeFab, SendFab],
};

FabWrapper.bottomPosition = bottomPosition;

export default FabWrapper;
