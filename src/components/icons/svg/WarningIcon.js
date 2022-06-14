import PropTypes from 'prop-types';
import React from 'react';
import { Path } from 'react-native-svg';
import Svg from '../Svg';

const WarningIcon = ({ color, colors, ...props }) => {
  const size = props.size || 22;

  return (
    <Svg {...props} height={size} viewBox="0 0 22 21" width={size}>
      <Path
        d="M2.77232 20.2883H19.2277C20.8974 20.2883 22 19.0282 22 17.516C22 17.0539 21.8845 16.5919 21.6325 16.1508L13.389 1.39666C12.8745 0.472554 11.9399 0 11.0052 0C10.0706 0 9.11504 0.472554 8.61098 1.39666L0.367542 16.1613C0.115513 16.5919 0 17.0539 0 17.516C0 19.0282 1.10263 20.2883 2.77232 20.2883Z"
        fill={color || colors.black}
        fillRule="nonzero"
      />
      <Path
        d="M11.0053 12.9585C10.3332 12.9585 9.95517 12.5909 9.92367 11.9189L9.76615 7.38235C9.73464 6.67877 10.2597 6.18521 10.9948 6.18521C11.7299 6.18521 12.2549 6.68927 12.2234 7.39285L12.0659 11.9084C12.0344 12.6014 11.6564 12.9585 11.0053 12.9585ZM11.0053 16.9489C10.2282 16.9489 9.65063 16.4449 9.65063 15.7098C9.65063 14.9642 10.2282 14.4707 11.0053 14.4707C11.7719 14.4707 12.3599 14.9642 12.3599 15.7098C12.3599 16.4554 11.7719 16.9489 11.0053 16.9489Z"
        fill={colors.white}
        fillRule="nonzero"
      />
    </Svg>
  );
};

WarningIcon.propTypes = {
  color: PropTypes.string,
};

export default WarningIcon;
