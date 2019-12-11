import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { G, Path } from 'svgs';
import { colors, position } from '../../../styles';
import { Centered } from '../../layout';
import { AnimatedSvg } from '../Svg';

const {
  add,
  concat,
  cond,
  cos,
  createAnimatedComponent,
  divide,
  lessOrEq,
  max,
  min,
  multiply,
  proc,
  sin,
  sub,
} = Animated;

const AnimatedPath = createAnimatedComponent(Path);

const convertProgress = proc(progress =>
  divide(multiply(360, min(100, max(0, progress))), 100)
);

function polarToCartesian(center, radius, angleInDegrees) {
  const angleInRadians = divide(
    multiply(sub(angleInDegrees, 90), Math.PI),
    180
  );

  return {
    x: concat(add(center, multiply(radius, cos(angleInRadians)))),
    y: concat(add(center, multiply(radius, sin(angleInRadians)))),
  };
}

function circlePath(center, radius, startAngle, endAngle) {
  const start = polarToCartesian(center, radius, multiply(endAngle, 0.9999));
  const end = polarToCartesian(center, radius, startAngle);
  const largeArcFlag = cond(lessOrEq(sub(endAngle, startAngle), 180), 0, 1);

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

  const pathWithSpaces = path.reduce((arr, p) => [...arr, p, ' '], []);
  return concat(...pathWithSpaces);
}

const ProgressIcon = ({
  color,
  progress,
  progressColor,
  size,
  strokeWidth,
  ...props
}) => {
  const radius = size / 2;
  const center = radius + 2;
  const viewBoxSize = size + strokeWidth * 2;

  return (
    <Centered {...props} {...position.sizeAsObject(size)}>
      <AnimatedSvg
        {...position.sizeAsObject(size)}
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      >
        <G originX={center} originY={center}>
          <AnimatedPath
            d={circlePath(center, radius, 0, 360)}
            fill="transparent"
            stroke={color}
            strokeLinecap="round"
            strokeWidth={strokeWidth}
          />
          <AnimatedPath
            d={circlePath(center, radius, 0, convertProgress(progress))}
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

ProgressIcon.propTypes = {
  color: PropTypes.string,
  progress: PropTypes.object,
  progressColor: PropTypes.string,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
};

ProgressIcon.defaultProps = {
  color: colors.alpha(colors.sendScreen.grey, 0.3),
  progress: 0,
  progressColor: colors.white,
  size: 29,
  strokeWidth: 2,
};

export default React.memo(ProgressIcon);
