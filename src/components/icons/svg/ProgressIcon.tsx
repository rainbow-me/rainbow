import React, { PropsWithChildren } from 'react';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { G, Path } from 'react-native-svg';
import { Centered } from '../../layout';
import Svg from '../Svg';
import { position } from '@/styles';
import { useTheme } from '@/theme';

const AnimatedSvg = Animated.createAnimatedComponent<PropsWithChildren>(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const convertProgress = (progress: number) => {
  'worklet';
  const normalizedProgress = Math.min(100, Math.max(0, progress));
  return (Math.PI * 2 * normalizedProgress) / 100;
};

const polarToCartesian = (center: number, radius: number, angleInRadians: number) => {
  'worklet';

  return {
    x: center + radius * Math.sin(angleInRadians),
    y: center + radius * -Math.cos(angleInRadians),
  };
};

const circlePath = (center: number, radius: number, startAngle: number, endAngle: number) => {
  'worklet';
  const start = polarToCartesian(center, radius, endAngle * 0.9999);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= Math.PI ? 0 : 1;

  const path = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y];

  return path.join(' ');
};

interface Props {
  progress: SharedValue<number>;
  color?: string;
  progressColor?: string;
  size?: number;
  strokeWidth?: number;
}

const ProgressIcon = ({ progress, color: givenColor, progressColor: givenProgressColor, size = 29, strokeWidth = 2, ...props }: Props) => {
  const { colors } = useTheme();
  const progressColor = givenProgressColor ?? colors.whiteLabel;
  const color = givenColor ?? colors.alpha(colors.sendScreen.grey, 0.3);
  const radius = size / 2;
  const center = radius + 2;
  const viewBoxSize = size + strokeWidth * 2;

  const outerPathProps = useAnimatedProps(() => ({
    d: circlePath(center, radius, 0, Math.PI * 2),
  }));

  const innerPathProps = useAnimatedProps(
    () => ({
      d: circlePath(center, radius, 0, convertProgress(progress.value)),
    }),
    [progress]
  );

  return (
    <Centered {...props} {...position.sizeAsObject(size)}>
      <AnimatedSvg
        {...position.sizeAsObject(size)}
        // @ts-ignore
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <G originX={center} originY={center}>
          <AnimatedPath animatedProps={outerPathProps} fill="transparent" stroke={color} strokeLinecap="round" strokeWidth={strokeWidth} />
          <AnimatedPath
            animatedProps={innerPathProps}
            fill="transparent"
            stroke={progressColor}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
        </G>
      </AnimatedSvg>
    </Centered>
  );
};

export default React.memo(ProgressIcon);
