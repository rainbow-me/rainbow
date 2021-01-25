import { constant, isNil, isNumber, times } from 'lodash';
import React from 'react';
import styled from 'styled-components/primitives';
import { withThemeContext } from '../context/ThemeContext';
import { magicMemo } from '../utils';
import { borders, position } from '@rainbow-me/styles';

export const DividerSize = 2;

const buildInsetFromProps = inset => {
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

const horizontalBorderLineStyles = inset => `
  ${inset[3] ? borders.buildRadius('left', 2) : ''}
  ${inset[1] ? borders.buildRadius('right', 2) : ''}
  left: ${inset[3]};
  right: ${inset[1]};
`;

const verticalBorderLineStyles = inset => `
  ${inset[2] ? borders.buildRadius('bottom', 2) : ''}
  ${inset[0] ? borders.buildRadius('top', 2) : ''}
  bottom: ${inset[2]};
  top: ${inset[0]};
`;

const BorderLine = styled.View`
  ${position.cover};
  background-color: ${({ color }) => color};
  ${({ horizontal, inset }) => {
    const insetFromProps = buildInsetFromProps(inset);
    return horizontal
      ? horizontalBorderLineStyles(insetFromProps)
      : verticalBorderLineStyles(insetFromProps);
  }}
`;

const Container = withThemeContext(styled.View`
  background-color: ${({ backgroundColor, colors }) =>
    backgroundColor || colors.white};
  flex-shrink: 0;
  height: ${({ horizontal, size }) => (horizontal ? size : '100%')};
  width: ${({ horizontal, size }) => (horizontal ? '100%' : size)};
`);

const Divider = ({
  backgroundColor,
  color,
  horizontal = true,
  inset = [0, 0, 0, 19],
  size = DividerSize,
  colors,
  ...props
}) => (
  <Container
    {...props}
    backgroundColor={backgroundColor}
    horizontal={horizontal}
    size={size}
  >
    <BorderLine
      {...props}
      color={color || colors.rowDivider}
      horizontal={horizontal}
      inset={inset}
    />
  </Container>
);

export default magicMemo(withThemeContext(Divider), ['color', 'inset']);
