import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors, position } from '../styles';

const DefaultDividerSize = 2;

const horizontalBorderLineStyles = ({ insetLeft, insetRight }) => css`
  ${insetLeft ? borders.buildRadius('left', 2) : null};
  ${insetRight ? borders.buildRadius('right', 2) : null};
  left: ${insetLeft || 0};
  right: ${insetRight || 0};
`;

const verticalBorderLineStyles = ({ insetBottom, insetTop }) => css`
  ${insetBottom ? borders.buildRadius('bottom', 2) : null};
  ${insetTop ? borders.buildRadius('top', 2) : null};
  bottom: ${insetBottom || 0};
  top: ${insetTop || 0};
`;

const BorderLine = styled.View`
  ${position.cover};
  ${({ horizontal, ...props }) => (
    horizontal
      ? horizontalBorderLineStyles(props)
      : verticalBorderLineStyles(props)
  )}
  background-color: ${({ color }) => color};
  bottom: 0;
  top: 0;
`;

const Container = styled(Row)`
  background-color: ${colors.white};
  flex-shrink: 0;
  height: ${({ horizontal, size }) => (horizontal ? size : '100%')};
  width: ${({ horizontal, size }) => (horizontal ? '100%' : size)};
`;

const Divider = ({
  color,
  horizontal,
  size,
  ...props
}) => (
  <Container {...props} horizontal={horizontal} size={size}>
    <BorderLine
      {...props}
      color={color}
      horizontal={horizontal}
    />
  </Container>
);

Divider.propTypes = {
  color: PropTypes.string,
  horizontal: PropTypes.bool,
  insetBottom: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  insetLeft: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  insetRight: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  insetTop: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
  size: PropTypes.number,
};

Divider.defaultProps = {
  color: colors.lightGrey,
  horizontal: true,
  insetLeft: 19,
  insetRight: false,
  size: DefaultDividerSize,
};

Divider.size = DefaultDividerSize;

export default Divider;
