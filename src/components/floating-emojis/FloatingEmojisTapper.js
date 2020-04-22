import PropTypes from 'prop-types';
import React from 'react';
import { TouchableScale } from '../animations';
import FloatingEmojis from './FloatingEmojis';
import FloatingEmojisTapHandler from './FloatingEmojisTapHandler';

const FloatingEmojisTapper = ({ activeScale, children, ...props }) => (
  <FloatingEmojis
    distance={350}
    duration={2000}
    size={36}
    wiggleFactor={1}
    {...props}
  >
    {({ onNewEmoji }) => (
      <FloatingEmojisTapHandler onNewEmoji={onNewEmoji}>
        <TouchableScale activeScale={activeScale}>{children}</TouchableScale>
      </FloatingEmojisTapHandler>
    )}
  </FloatingEmojis>
);

FloatingEmojisTapper.propTypes = {
  activeScale: PropTypes.number,
  children: PropTypes.node,
};

FloatingEmojisTapper.defaultProps = {
  activeScale: 1.01,
};

export default FloatingEmojisTapper;
