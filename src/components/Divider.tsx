import { constant, isNil, isNumber, times } from 'lodash';
import React from 'react';
import styled from 'styled-components';
import { magicMemo } from '../utils';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { borders, position } from '@rainbow-me/styles';

export const DividerSize = 2;

const buildInsetFromProps = (inset: any) => {
  if (!inset) return times(4, constant(0));
  // @ts-expect-error ts-migrate(2345) FIXME: Argument of type 'number' is not assignable to par... Remove this comment to see the full error message
  if (isNumber(inset)) return times(4, inset);

  const rightInset = !isNil(inset[1]) ? inset[1] : inset[0];

  return [
    inset[0],
    rightInset,
    inset[2] || inset[0],
    !isNil(inset[3]) ? inset[3] : rightInset,
  ];
};

const horizontalBorderLineStyles = (inset: any) => `
  ${inset[3] ? borders.buildRadius('left', 2) : ''}
  ${inset[1] ? borders.buildRadius('right', 2) : ''}
  left: ${inset[3]};
  right: ${inset[1]};
`;

const verticalBorderLineStyles = (inset: any) => `
  ${inset[2] ? borders.buildRadius('bottom', 2) : ''}
  ${inset[0] ? borders.buildRadius('top', 2) : ''}
  bottom: ${inset[2]};
  top: ${inset[0]};
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const BorderLine = styled.View`
  ${position.cover};
  background-color: ${({ color }: any) => color};
  ${({ horizontal, inset }: any) => {
    const insetFromProps = buildInsetFromProps(inset);
    return horizontal
      ? horizontalBorderLineStyles(insetFromProps)
      : verticalBorderLineStyles(insetFromProps);
  }}
`;

// @ts-expect-error ts-migrate(2551) FIXME: Property 'View' does not exist on type 'StyledInte... Remove this comment to see the full error message
const Container = styled.View`
  background-color: ${({ backgroundColor, theme: { colors } }: any) =>
    backgroundColor || colors.white};
  flex-shrink: 0;
  height: ${({ horizontal, size }: any) => (horizontal ? size : '100%')};
  width: ${({ horizontal, size }: any) => (horizontal ? '100%' : size)};
`;

const Divider = ({
  backgroundColor,
  color,
  horizontal = true,
  inset = [0, 0, 0, 19],
  size = DividerSize,
  ...props
}: any) => {
  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Container
      {...props}
      backgroundColor={backgroundColor}
      horizontal={horizontal}
      size={size}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <BorderLine
        {...props}
        color={color || colors.rowDivider}
        horizontal={horizontal}
        inset={inset}
      />
    </Container>
  );
};

// @ts-expect-error ts-migrate(2554) FIXME: Expected 3 arguments, but got 2.
export default magicMemo(Divider, ['color', 'inset']);
