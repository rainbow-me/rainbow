import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { onlyUpdateForKeys } from 'recompact';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import SendFab from './SendFab';
import ExchangeFab from './ExchangeFab';

const bottomPosition = 21 + safeAreaInsetValues.bottom;

const enhance = onlyUpdateForKeys(['children', 'disabled']);
const FabWrapper = enhance(({
  children,
  disabled,
  fabs,
  ...props
}) => (
  <FlexItem>
    {children}
    {!disabled && (
      <RowWithMargins
        css={`
          bottom: ${bottomPosition};
          position: absolute;
          right: 15;
          z-index: 2;
        `}
        direction="row-reverse"
        margin={12}
      >
        {fabs.map(fab => createElement(fab, props))}
      </RowWithMargins>
    )}
  </FlexItem>
));

FabWrapper.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  fabs: PropTypes.arrayOf(PropTypes.func).isRequired,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

FabWrapper.defaultProps = {
  fabs: [ExchangeFab, SendFab],
};

FabWrapper.bottomPosition = bottomPosition;

export default FabWrapper;
