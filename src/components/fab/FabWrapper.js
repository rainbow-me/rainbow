import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import SendFab from './SendFab';

const FabWrapperBottomPosition = 21;

const FabWrapper = ({
  children, disabled, fabs, ...rest
}) => (
  <FlexItem>
    {children}
    {!disabled && (
      <RowWithMargins
        css={`
          bottom: ${safeAreaInsetValues.bottom + FabWrapperBottomPosition};
          position: absolute;
          right: 12;
        `}
        direction="row-reverse"
        margin={12}
        marginKey="left"
      >
        {fabs.map(fab => createElement(fab, rest))}
      </RowWithMargins>
    )}
  </FlexItem>
);

FabWrapper.propTypes = {
  children: PropTypes.node,
  disabled: PropTypes.bool,
  fabs: PropTypes.arrayOf(PropTypes.func).isRequired,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

FabWrapper.defaultProps = {
  fabs: [SendFab],
};

FabWrapper.bottomPosition = FabWrapperBottomPosition;

export default FabWrapper;
