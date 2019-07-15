import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import Animated from 'react-native-reanimated';
import { hoistStatics, withProps } from 'recompact';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import DeleteButton from './DeleteButton';
import SendFab from './SendFab';

const FabWrapperBottomPosition = 21;

const FabWrapper = ({
  children,
  deleteButtonTranslate,
  disabled,
  fabs,
  ...props
}) => (
  <FlexItem>
    {children}
    <DeleteButton deleteButtonTranslate={deleteButtonTranslate} />
    {!disabled && (
      <RowWithMargins
        css={`
          bottom: ${safeAreaInsetValues.bottom + FabWrapperBottomPosition};
          position: absolute;
          right: 15;
          z-index: 2;
        `}
        direction="row-reverse"
        margin={12}
        marginKey="left"
      >
        {fabs.map(fab => (
          createElement(fab, {
            ...props,
            deleteButtonTranslate,
          })
        ))}
      </RowWithMargins>
    )}
  </FlexItem>
);

FabWrapper.propTypes = {
  children: PropTypes.node,
  deleteButtonTranslate: PropTypes.object,
  disabled: PropTypes.bool,
  fabs: PropTypes.arrayOf(PropTypes.func).isRequired,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
};

FabWrapper.defaultProps = {
  fabs: [SendFab],
};

FabWrapper.bottomPosition = FabWrapperBottomPosition;

export default hoistStatics(withProps({
  deleteButtonTranslate: new Animated.Value(100),
}))(FabWrapper);
