import PropTypes from 'prop-types';
import React from 'react';
import { Circle, G, Rect } from 'svgs';
import { withNeverRerender } from '../../hoc';
import { colors, padding } from '../../styles';
import { Svg } from '../icons';
import { Row } from '../layout';

const AssetListItemSkeleton = ({ color, index }) => (
  <Row
    align="center"
    css={`
      ${padding((index === 0 ? 15 : 12.5), 19, 12.5, 15)}
      opacity: ${(1 - (0.2 * index))}
    `}
    justify="space-between"
  >
    <Svg height={40} width={151} viewBox="0 0 151 40">
      <G fill={color} transform="translate(0 -.667)">
        <Rect height={8} rx="1" width={100} x="51" y="6.667" />
        <Rect height={8} rx="1" width={60} x="51" y="26.667" />
        <Circle cx="20" cy="20.67" r="20" />
      </G>
    </Svg>
    <Svg height={28} width={80} viewBox="0 0 80 28">
      <G fill={color} transform="translate(0 -.667)">
        <Rect height={8} rx="1" width={80} y=".667" />
        <Rect height={8} rx="1" width={50} x="30" y="20.667" />
      </G>
    </Svg>
  </Row>
);

AssetListItemSkeleton.propTypes = {
  color: PropTypes.string,
  index: PropTypes.number,
};

AssetListItemSkeleton.defaultProps = {
  color: colors.skeleton,
  index: 0,
};

export default withNeverRerender(AssetListItemSkeleton);
