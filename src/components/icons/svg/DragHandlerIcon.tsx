import React from 'react';
import { Circle, SvgProps } from 'react-native-svg';
import Svg from '../Svg';

export function DragHandlerIcon({ color, ...props }: SvgProps) {
  return (
    <Svg width="16" height="17" viewBox="0 0 16 17" fill="none" {...props}>
      <Circle cx="5.0909" cy="14.478" r="1.45455" fill={color} />
      <Circle cx="10.9091" cy="14.478" r="1.45455" fill={color} />
      <Circle cx="5.0909" cy="8.65987" r="1.45455" fill={color} />
      <Circle cx="10.9091" cy="8.65987" r="1.45455" fill={color} />
      <Circle cx="5.0909" cy="2.84175" r="1.45455" fill={color} />
      <Circle cx="10.9091" cy="2.84175" r="1.45455" fill={color} />
    </Svg>
  );
}
