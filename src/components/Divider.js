import { constant, isNil, isNumber, times } from 'lodash';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { View } from 'react-primitives';
import { borders, colors, position } from '../styles';
import { magicMemo } from '../utils';

const DefaultDividerSize = 2;

const buildInsetFromProps = inset => {
  if (!inset) return times(4, constant(0));
  if (isNumber(inset)) return times(4, inset);

  const rightInset = !isNil(inset[1]) ? inset[1] : inset[0];

  return [
    inset[0],
    rightInset,
    inset[2] || inset[0],
    !isNil(inset[3]) ? inset[3] : rightInset,
  ];
};

const horizontalBorderLineStyles = inset => ({
  ...(inset[3] ? borders.buildRadiusAsObject('left', 2) : {}),
  ...(inset[1] ? borders.buildRadiusAsObject('right', 2) : {}),
  left: inset[3],
  right: inset[1],
});

const verticalBorderLineStyles = inset => ({
  ...(inset[2] ? borders.buildRadiusAsObject('bottom', 2) : {}),
  ...(inset[0] ? borders.buildRadiusAsObject('top', 2) : {}),
  bottom: inset[2],
  top: inset[0],
});

const Divider = magicMemo(
  ({ backgroundColor, color, horizontal, inset, size, ...props }) => {
    const borderLineStyles = useMemo(() => {
      const insetFromProps = buildInsetFromProps(inset);
      return horizontal
        ? horizontalBorderLineStyles(insetFromProps)
        : verticalBorderLineStyles(insetFromProps);
    }, [horizontal, inset]);

    return (
      <View
        backgroundColor={backgroundColor || colors.white}
        flexShrink={0}
        height={horizontal ? size : '100%'}
        width={horizontal ? '100%' : size}
        {...props}
      >
        <View
          {...position.coverAsObject}
          backgroundColor={color}
          horizontal={horizontal}
          style={borderLineStyles}
          {...props}
        />
      </View>
    );
  },
  ['color', 'inset']
);

Divider.displayName = 'Divider';

Divider.propTypes = {
  color: PropTypes.string,
  horizontal: PropTypes.bool,
  inset: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.number),
    PropTypes.bool,
  ]),
  size: PropTypes.number,
};

Divider.defaultProps = {
  color: colors.rowDivider,
  horizontal: true,
  inset: [0, 0, 0, 19],
  size: DefaultDividerSize,
};

Divider.size = DefaultDividerSize;

export default Divider;
