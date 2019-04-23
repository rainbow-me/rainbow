import PropTypes from 'prop-types';
import React from 'react';
import EmojiRenderer from 'react-native-emoji';
import { fonts } from '../../styles';

const Emoji = ({ lineHeight, size, ...props }) => (
  <EmojiRenderer
    {...props}
    css={`
      font-size: ${fonts.size[size]};
      line-height: ${fonts.lineHeight[lineHeight]};
    `}
  />
);

Emoji.propTypes = {
  lineHeight: PropTypes.oneOf(Object.keys(fonts.lineHeight)),
  size: PropTypes.oneOf(Object.keys(fonts.size)),
};

Emoji.defaultProps = {
  lineHeight: 'none',
  size: 'h4',
};

export default Emoji;
