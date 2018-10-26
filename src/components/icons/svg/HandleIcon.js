import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { Animated } from 'react-native';
import { Path } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

class HandleIcon extends Component {
  static propTypes = {
    color: PropTypes.string,
    progress: PropTypes.number,
  };

  static defaultProps = {
    color: colors.white,
    progress: 6.5,
  };

  render() {
    const { color, progress } = this.props;

    return (
      <Svg
        {...this.props}
        height="17"
        width="42"
        viewBox="0 0 40 14"
      >
        <Path
          d={`M19,3 L32.5,${progress}`}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="transparent"
          transform="translate(24.500000, 3.500000) scale(-1, 1) translate(-24.500000, -3.500000)"
        />
        <Path
          d={`M3,3 L16.5,${progress}`}
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="transparent"
        />
      </Svg>
    );
  }
}

export default Animated.createAnimatedComponent(HandleIcon);
