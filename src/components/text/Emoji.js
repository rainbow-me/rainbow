import PropTypes from 'prop-types';
import React from 'react';
import EmojiRenderer from 'react-native-emoji';
import styled from 'styled-components/primitives';
import { fonts } from '../../styles';

const StyledEmoji = styled(EmojiRenderer)`
  font-size: ${({ size }) => size};
  line-height: 0;
`;

const Emoji = ({ size, ...props }) => (
  <StyledEmoji
    {...props}
    size={size}
  />
);

Emoji.propTypes = {
  size: PropTypes.oneOf([
    ...Object.keys(fonts.size),
    ...Object.values(fonts.size),
  ]),
};

Emoji.defaultProps = {
  size: fonts.size.h4,
};

export default Emoji;
