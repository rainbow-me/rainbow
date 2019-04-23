import {
  constant,
  isNil,
  isNumber,
  times,
} from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styled, { css } from 'styled-components/primitives';
import { Row } from './layout';
import { borders, colors, position } from '../styles';

const DefaultDividerSize = 2;

const buildInsetFromProps = (inset) => {
  if (!inset) return times(4, constant(0));
  if (isNumber(inset)) return times(4, inset);

  const rightInset = !isNil(inset[1]) ? inset[1] : inset[0];

  return [
    inset[0],
    rightInset,
    inset[2] || inset[0],
    !isNil(inset[3]) ? inset[3] : rightInset,
  ];
};

const horizontalBorderLineStyles = (inset) => css`
  ${inset[3] ? borders.buildRadius('left', 2) : null}
  ${inset[1] ? borders.buildRadius('right', 2) : null}
  left: ${inset[3]};
  right: ${inset[1]};
`;

const verticalBorderLineStyles = (inset) => css`
  ${inset[2] ? borders.buildRadius('bottom', 2) : null}
  ${inset[0] ? borders.buildRadius('top', 2) : null}
  bottom: ${inset[2]};
  top: ${inset[0]};
`;

const BorderLine = styled.View`
  ${position.cover};
  ${({ horizontal, inset }) => (
    horizontal
      ? horizontalBorderLineStyles(inset)
      : verticalBorderLineStyles(inset)
  )};
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
  inset,
  size,
  ...props
}) => (
  <Container {...props} horizontal={horizontal} size={size}>
    <BorderLine
      {...props}
      color={color}
      horizontal={horizontal}
      inset={buildInsetFromProps(inset)}
    />
  </Container>
);

Divider.propTypes = {
  color: PropTypes.string,
  horizontal: PropTypes.bool,
  inset: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.bool]),
  size: PropTypes.number,
};

Divider.defaultProps = {
  color: colors.lightGrey,
  horizontal: true,
  inset: [0, 0, 0, 19],
  size: DefaultDividerSize,
};

Divider.size = DefaultDividerSize;

export default Divider;
