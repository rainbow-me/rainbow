import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { G, Path } from 'svgs';
import { Animated } from 'react-native';
import { colors } from '../../../styles';
import Svg from '../Svg';

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians)),
  };
}

function circlePath(x, y, radius, startAngle, endAngle) {
  const start = polarToCartesian(x, y, radius, endAngle * 0.9999);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const d = [
    'M', start.x, start.y,
    'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y,
  ];

  return d.join(' ');
}

function convertProgress(progress) {
  return (360 * Math.min(100, Math.max(0, progress || 0))) / 100;
}

class ProgressIcon extends Component {
  static propTypes = {
    color: PropTypes.string,
    progress: PropTypes.number,
    progressColor: PropTypes.string,
    size: PropTypes.number,
  };

  static defaultProps = {
    color: colors.white,
    progressColor: colors.black,
    progress: 0,
  };

  render() {
    const {
      color,
      progress,
      progressColor,
      size,
    } = this.props;

    const centerX = (size / 2) + 2;
    const centerY = (size / 2) + 2;
    const radius = size / 2;

    return (
      <Svg height={size} width={size} viewBox={`0 0 ${size + 4} ${size + 4}`} {...this.props}>
        <G originX={centerX} originY={centerY}>
          <Path
            d={circlePath(centerX, centerY, radius, 0, 360)}
            stroke={color}
            strokeWidth="3px"
            strokeLinecap="round"
            fill="transparent"
          />
          {progress > 0 ? <Path
            d={circlePath(centerX, centerY, radius, 0, convertProgress(progress))}
            stroke={progressColor}
            strokeWidth="3px"
            strokeLinecap="round"
            fill="transparent"
          /> : null}
        </G>
      </Svg>
    );
  }
}

export default Animated.createAnimatedComponent(ProgressIcon);
