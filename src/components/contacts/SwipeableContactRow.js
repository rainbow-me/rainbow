import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { Animated } from 'react-native';
import FastImage from 'react-native-fast-image';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { toClass } from 'recompact';
import DeleteIcon from '../../assets/swipeToDelete.png';
import EditIcon from '../../assets/swipeToEdit.png';
import { colors, margin, position } from '../../styles';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import ContactRow from './ContactRow';
import showDeleteContactActionSheet from './showDeleteContactActionSheet';

const AnimatedCentered = Animated.createAnimatedComponent(toClass(Centered));

const RightAction = ({ onPress, progress, text, x }) => {
  const isEdit = text === 'Edit';
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [x, 0],
  });

  return (
    <AnimatedCentered
      flex={1}
      marginRight={isEdit ? 0 : 10}
      marginTop={12}
      style={{ transform: [{ translateX }] }}
    >
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
        <FastImage
          css={margin(0, 10, 5, 10)}
          source={isEdit ? EditIcon : DeleteIcon}
          style={position.sizeAsObject(35)}
        />
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          letterSpacing="tight"
          size="smaller"
          weight="medium"
        >
          {text}
        </Text>
      </ButtonPressAnimation>
    </AnimatedCentered>
  );
};

RightAction.propTypes = {
  onPress: PropTypes.func,
  progress: PropTypes.any,
  text: PropTypes.string,
  x: PropTypes.number,
};

export default class SwipeableContactRow extends PureComponent {
  static propTypes = {
    address: PropTypes.string,
    color: PropTypes.number,
    navigation: PropTypes.object,
    nickname: PropTypes.string,
    onChange: PropTypes.func,
    onPress: PropTypes.func,
    onTouch: PropTypes.func,
    onTransitionEnd: PropTypes.func,
    selectedInputId: PropTypes.object,
  };

  swipeableRef = undefined;

  close = () => this.swipeableRef.close();

  handleDeleteContact = async () => {
    const { address, nickname, onChange } = this.props;
    this.close();
    showDeleteContactActionSheet({
      address,
      nickname,
      onDelete: onChange,
    });
  };

  handleEditContact = () => {
    this.close();
    this.props.onSelectEdit(this.props);
  };

  handleLongPress = () => this.swipeableRef.openRight();

  handlePress = () => this.props.onPress(this.props.address);

  handlePressStart = () => {
    this.props.onTouch(this.props.address);
  };

  handleRef = ref => {
    this.swipeableRef = ref;
  };

  renderRightActions = progress => (
    <Row width={120}>
      <RightAction
        onPress={this.handleEditContact}
        progress={progress}
        text="Edit"
        x={120}
      />
      <RightAction
        onPress={this.handleDeleteContact}
        progress={progress}
        text="Delete"
        x={90}
      />
    </Row>
  );

  render = () => (
    <Swipeable
      friction={2}
      ref={this.handleRef}
      renderRightActions={this.renderRightActions}
      rightThreshold={0}
    >
      <ContactRow
        {...this.props}
        onLongPress={this.handleLongPress}
        onPress={this.handlePress}
        onPressStart={this.handlePressStart}
      />
    </Swipeable>
  );
}
