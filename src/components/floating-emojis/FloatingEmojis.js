import React, { PureComponent } from 'react';
import { View } from 'react-primitives';
import PropTypes from 'prop-types';
import stylePropType from 'react-style-proptype';
import { position } from '../../styles';
import FloatingEmoji from './FloatingEmoji';

const getRandomNumber = (min, max) => Math.random() * (max - min) + min;

const createEmojiItem = (range) => {
  const right = `${getRandomNumber(...range)}%`;

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
    duration: PropTypes.number,
    emoji: PropTypes.string.isRequired,
    range: PropTypes.arrayOf(PropTypes.number),
    size: PropTypes.string.isRequired,
    style: stylePropType,
    top: PropTypes.number,
  }

  static defaultProps = {
    count: -1,
    range: [0, 80],
    size: 'h2',
  }

  state = {
    emojis: [],
  }

  componentDidUpdate(prevProps) {
    const oldCount = prevProps.count;
    const newCount = this.props.count;
    const numEmojis = newCount - oldCount;

    if (numEmojis <= 0) return;

    const items = Array(numEmojis).fill();
    const newEmojis = items.map((_, i) => oldCount + i).map(this.createItem);

    this.setState({ emojis: this.state.emojis.concat(newEmojis) });
  }

  createItem = () => createEmojiItem(this.props.range)

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
          duration={this.props.duration}
          emoji={this.props.emoji}
          id={id}
          key={id}
          onComplete={this.removeEmoji}
          size={this.props.size}
          top={this.props.top}
        />
      ))}
    </View>
  )
}
