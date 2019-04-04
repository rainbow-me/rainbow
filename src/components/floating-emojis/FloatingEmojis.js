import React, { PureComponent } from 'react';
import { View } from 'react-primitives';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';
import { position } from '../../styles';
import FloatingEmoji from './FloatingEmoji';

const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

const createEmojiItem = () => {
  const right = `${getRandomNumber(0, 80)}%`;

  return ({
    id: right,
    right,
  });
};

export default class FloatingEmojis extends PureComponent {
  static propTypes = {
    color: PropTypes.string,
    count: PropTypes.number,
    distance: PropTypes.number,
    emoji: PropTypes.string.isRequired,
    size: PropTypes.string.isRequired,
    style: stylePropType,
  }

  static defaultProps = {
    count: -1,
    size: 'h2',
  }

  state = {
    emojis: [],
  }

  componentWillUpdate(nextProps) {
    const oldCount = this.props.count;
    const newCount = nextProps.count;
    const numEmojis = newCount - oldCount;

    if (numEmojis <= 0) return;

    const items = Array(numEmojis).fill();
    const newEmojis = items.map((_, i) => oldCount + i).map(createEmojiItem);

    this.setState({ emojis: this.state.emojis.concat(newEmojis) });
  }

  removeEmoji = (id) => {
    const newEmojis = this.state.emojis.filter(emoji => emoji.id !== id);
    this.setState({ emojis: newEmojis });
  }

  render = () => (
    <View
      css={position.cover}
      pointerEvents="none"
      style={this.props.style}
    >
      {this.state.emojis.map(({ id, ...item }) => (
        <FloatingEmoji
          {...item}
          distance={this.props.distance}
          emoji={this.props.emoji}
          id={id}
          key={id}
          onComplete={this.removeEmoji}
          size={this.props.size}
        />
      ))}
    </View>
  )
}
