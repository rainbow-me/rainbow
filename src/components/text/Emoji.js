import PropTypes from 'prop-types';
import React from 'react';
import EmojiRenderer from 'react-native-emoji';
import { buildTextStyles, fonts } from '../../styles';

const Emoji = props => <EmojiRenderer {...props} css={buildTextStyles} emoji />;

Emoji.propTypes = {
  lineHeight: PropTypes.oneOf(Object.keys(fonts.lineHeight)),
  size: PropTypes.oneOf(Object.keys(fonts.size)),
};

Emoji.defaultProps = {
  lineHeight: 'none',
  size: 'h4',
};

export default Emoji;
