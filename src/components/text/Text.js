import PropTypes from 'prop-types';
import React from 'react';
import { Text as TextPrimitive } from 'react-primitives';
import { useTextStyles } from '../../styles';

const Text = (
  {
    align,
    color,
    isEmoji,
    family,
    letterSpacing,
    lineHeight,
    mono,
    opacity,
    size,
    style,
    uppercase,
    weight,
    ...props
  },
  ref
) => {
  const textStyles = useTextStyles({
    align,
    color,
    family,
    isEmoji,
    letterSpacing,
    lineHeight,
    mono,
    opacity,
    size,
    uppercase,
    weight,
  });

  return (
    <TextPrimitive
      {...props}
      allowFontScaling={false}
      ref={ref}
      style={[textStyles, style]}
    />
  );
};

Text.propTypes = {
  align: PropTypes.oneOf(['auto', 'center', 'left', 'justify', 'right']),
  color: PropTypes.string,
  family: PropTypes.string,
  isEmoji: PropTypes.bool,
  letterSpacing: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  lineHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  mono: PropTypes.bool,
  opacity: PropTypes.number,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  style: PropTypes.object,
  uppercase: PropTypes.bool,
  weight: PropTypes.string,
};

export default React.forwardRef(Text);
