import React from 'react';
import Animated, { useAnimatedProps } from 'react-native-reanimated';
import { G, Path } from 'react-native-svg';
import { Centered } from '../../layout';
import Svg from '../Svg';
import { useTheme } from '@rainbow-me/context';
import { position } from '@rainbow-me/styles';

const AnimatedSvg = Animated.createAnimatedComponent(Svg);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const convertProgress = (progress: number) => {
  'worklet';
  return (360 * Math.min(100, Math.max(0, progress))) / 100;
};

const polarToCartesian = (
  center: number,
  radius: number,
  angleInDegrees: number
) => {
  'worklet';

  const angleInRadians = (Math.PI * (angleInDegrees - 90)) / 180;

  return {
    x: center + radius * Math.cos(angleInRadians),
    y: center + radius * Math.sin(angleInRadians),
  };
};

const circlePath = (
  center: number,
  radius: number,
  startAngle: number,
  endAngle: number
) => {
  'worklet';
  const start = polarToCartesian(center, radius, endAngle * 0.9999);
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

  const path = [
    'M',
    start.x,
    start.y,
    'A',
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ];

  return path.join(' ');
};

interface Props {
  progress: Animated.SharedValue<number>;
  color?: string;
  progressColor?: string;
  size?: number;
  strokeWidth?: number;
}

const ProgressIcon = ({
  progress,
  color: givenColor,
  progressColor: givenProgressColor,
  size = 29,
  strokeWidth = 2,
  ...props
}: Props) => {
  const { colors } = useTheme();
  const progressColor = givenProgressColor ?? colors.whiteLabel;
  const color = givenColor ?? colors.alpha(colors.sendScreen.grey, 0.3);
  const radius = size / 2;
  const center = radius + 2;
  const viewBoxSize = size + strokeWidth * 2;

  const outerPathProps = useAnimatedProps(() => ({
    d: circlePath(center, radius, 0, 360),
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
          <AnimatedPath
            animatedProps={outerPathProps}
            fill="transparent"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
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
