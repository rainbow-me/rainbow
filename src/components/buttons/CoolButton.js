import React from 'react';
import PropTypes from 'prop-types';
import { compose, onlyUpdateForKeys, withProps } from 'recompact';
import { withNeverRerender } from '../../hoc';
import {
  colors,
  margin,
  padding,
  position,
} from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import InnerBorder from '../InnerBorder';
import { Row, RowWithMargins } from '../layout';
import { ShadowStack } from '../shadow-stack';
import { Text } from '../text';

const CoolCaretIcon = compose(
  withNeverRerender,
  withProps({
    color: 'white',
    flex: 0,
    name: 'caret',
    size: 7.5,
  }),
)(Icon);

const CoolLabel = withProps({
  color: 'white',
  flex: 1,
  size: 'lmedium',
  weight: 'semibold',
})(Text);

const enhance = onlyUpdateForKeys(['children', 'color']);

const CoolButton = enhance(({
  borderRadius,
  children,
  color,
  onPress,
  shadows,
}) => (
  <ButtonPressAnimation onPress={onPress}>
    <Row flex={0} css={margin(0, 15)}>
      <ShadowStack
        {...position.coverAsObject}
        backgroundColor={color}
        borderRadius={borderRadius}
        shadows={shadows}
      />
      <RowWithMargins
        align="center"
        css={padding(9, 15, 12)}
        margin={9.02}
        zIndex={1}
      >
        <CoolLabel>{children}</CoolLabel>
        <CoolCaretIcon />
      </RowWithMargins>
      <InnerBorder radius={borderRadius} />
    </Row>
  </ButtonPressAnimation>
));

CoolButton.propTypes = {
  borderRadius: PropTypes.number,
  children: PropTypes.node,
  color: PropTypes.string,
  onPress: PropTypes.func,
  shadows: PropTypes.arrayOf(PropTypes.array),
};

CoolButton.defaultProps = {
  borderRadius: 20,
  shadows: [
    [0, 0, 1, colors.dark, 0.01],
    [0, 4, 12, colors.dark, 0.04],
    [0, 8, 23, colors.dark, 0.05],
  ],
};

export default CoolButton;
