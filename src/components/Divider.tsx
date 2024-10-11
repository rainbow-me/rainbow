import { isNil, isNumber } from 'lodash';
import React from 'react';
import { magicMemo } from '../utils';
import styled from '@/styled-thing';
import { borders, position } from '@/styles';
import { View } from 'react-native';
import { ThemeContextProps, useTheme } from '@/theme';

export const DividerSize = 2;

const buildInsetFromProps = (inset: number | number[]) => {
  if (!inset) return [0, 0, 0, 0];
  if (isNumber(inset)) return [inset, inset, inset, inset];

  const rightInset = !isNil(inset[1]) ? inset[1] : inset[0];

  return [inset[0], rightInset, inset[2] || inset[0], !isNil(inset[3]) ? inset[3] : rightInset];
};

const horizontalBorderLineStyles = (inset: number[]) => `
  ${inset[3] ? borders.buildRadius('left', 2) : ''}
  ${inset[1] ? borders.buildRadius('right', 2) : ''}
  left: ${inset[3]};
  right: ${inset[1]};
`;

horizontalBorderLineStyles.object = (inset: number[]) => ({
  ...(inset[3] ? borders.buildRadiusAsObject('left', 2) : {}),
  ...(inset[1] ? borders.buildRadiusAsObject('right', 2) : {}),
  left: inset[3],
  right: inset[1],
});

const verticalBorderLineStyles = (inset: number[]) => `
  ${inset[2] ? borders.buildRadius('bottom', 2) : ''}
  ${inset[0] ? borders.buildRadius('top', 2) : ''}
  bottom: ${inset[2]};
  top: ${inset[0]};
`;

verticalBorderLineStyles.object = (inset: number[]) => ({
  ...(inset[2] ? borders.buildRadiusAsObject('bottom', 2) : {}),
  ...(inset[0] ? borders.buildRadiusAsObject('top', 2) : {}),
  bottom: inset[2],
  top: inset[0],
});

type BorderLineProps = {
  color: string;
  horizontal: boolean;
  inset: number | number[];
};

const BorderLine = styled(View)(({ color, horizontal, inset }: BorderLineProps) => {
  const insetFromProps = buildInsetFromProps(inset);
  return {
    ...position.coverAsObject,
    backgroundColor: color,
    ...(horizontal ? horizontalBorderLineStyles.object(insetFromProps) : verticalBorderLineStyles.object(insetFromProps)),
  };
});

type ContainerProps = {
  backgroundColor: string;
  horizontal: boolean;
  size: number;
  theme: ThemeContextProps;
};

const Container = styled(View)({
  backgroundColor: ({ backgroundColor, theme: { colors } }: ContainerProps) => backgroundColor || colors.white,
  flexShrink: 0,
  height: ({ horizontal, size }: ContainerProps) => (horizontal ? size : '100%'),
  width: ({ horizontal, size }: ContainerProps) => (horizontal ? '100%' : size),
});

type DividerProps = {
  backgroundColor?: string;
  color?: string;
  horizontal?: boolean;
  inset?: number | number[];
  size?: number;
  flex?: number;
};

const Divider = ({
  backgroundColor = undefined,
  color = undefined,
  horizontal = true,
  inset = [0, 0, 0, 19],
  size = DividerSize,
  ...props
}: DividerProps) => {
  const { colors } = useTheme();
  return (
    <Container {...props} backgroundColor={backgroundColor} horizontal={horizontal} size={size}>
      <BorderLine {...props} color={color || colors.rowDivider} horizontal={horizontal} inset={inset} />
    </Container>
  );
};

export default magicMemo(Divider, ['color', 'inset']);
