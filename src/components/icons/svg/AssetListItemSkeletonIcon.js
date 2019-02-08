import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G, Rect } from 'svgs';
import { colors } from '../../../styles';
import Svg from '../Svg';

const AssetListItemSkeletonIcon = ({ color, ...props }) => (
  <Svg height="40" width="341" viewBox="0 0 341 40" {...props}>
    <G transform="translate(0 -.667)" fill={color}>
      <Rect x="51" y="6.667" width={100} height={8} rx="1" />
      <Rect x="51" y="26.667" width={60} height={8} rx="1" />
      <Rect x="261" y="6.667" width={80} height={8} rx="1" />
      <Rect x="291" y="26.667" width={50} height={8} rx="1" />
      <Circle cx="20" cy="20.67" r="20" />
    </G>
  </Svg>
);

AssetListItemSkeletonIcon.propTypes = {
  color: PropTypes.string,
};

AssetListItemSkeletonIcon.defaultProps = {
  color: colors.skeleton,
};

export default AssetListItemSkeletonIcon;
