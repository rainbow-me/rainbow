import PropTypes from 'prop-types';
import React, { createElement } from 'react';
import Animated from 'react-native-reanimated';
import { safeAreaInsetValues } from '../../utils';
import { FlexItem, RowWithMargins } from '../layout';
import SendFab from './SendFab';
import Text from '../text/Text';
import { hoistStatics, withProps } from 'recompact';
import Icon from '../icons/Icon';
import { ShadowStack } from '../shadow-stack';
import { borders, colors } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { buildFabShadow } from './FloatingActionButton';
import DeleteButton from './DeleteButton';

const FabWrapperBottomPosition = 21;

const FabWrapper = ({
  children, disabled, fabs, ...rest
}) => (
  <FlexItem>
    {children}
    <DeleteButton
      deleteButtonTranslate={rest.deleteButtonTranslate}
    />
    {!disabled && (
      <RowWithMargins
        css={`
          bottom: ${safeAreaInsetValues.bottom + FabWrapperBottomPosition};
          position: absolute;
          right: 12;
          z-index: 2;
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
