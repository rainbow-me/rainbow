import React, { useCallback, useImperativeHandle, useRef } from 'react';
import { Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import DeleteIcon from '../../assets/swipeToDelete.png';
import EditIcon from '../../assets/swipeToEdit.png';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
import ContactRow from './ContactRow';
import showDeleteContactActionSheet from './showDeleteContactActionSheet';
import { ImgixImage } from '@rainbow-me/images';
import { margin, position } from '@rainbow-me/styles';

const AnimatedCentered = Animated.createAnimatedComponent(Centered);

const RightAction = ({ onPress, progress, text, x }) => {
  const isEdit = text === 'Edit';
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [x, 0],
  });

  const { colors } = useTheme();

  return (
    <AnimatedCentered
      flex={1}
      marginRight={isEdit ? 0 : 10}
      style={{ transform: [{ translateX }] }}
    >
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
        <ImgixImage
          css={margin(0, 10, android ? 0 : 3, 10)}
          source={isEdit ? EditIcon : DeleteIcon}
          style={position.sizeAsObject(35)}
        />
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          letterSpacing="roundedTight"
          size="smaller"
          weight="semibold"
        >
          {text}
        </Text>
      </ButtonPressAnimation>
    </AnimatedCentered>
  );
};

const SwipeableContactRow = (
  {
    accountType,
    address,
    color,
    nickname,
    onPress,
    onSelectEdit,
    onTouch,
    removeContact,
  },
  forwardedRef
) => {
  const swipeableRef = useRef();

  useImperativeHandle(forwardedRef, () => ({
    close: swipeableRef.current?.close,
  }));

  const handleDeleteContact = useCallback(() => {
    swipeableRef.current?.close?.();
    showDeleteContactActionSheet({
      address,
      nickname,
      removeContact,
    });
  }, [address, nickname, removeContact]);

  const handleEditContact = useCallback(() => {
    swipeableRef.current?.close?.();
    onSelectEdit({ address, color, nickname });
  }, [address, color, nickname, onSelectEdit]);

  const handleLongPress = useCallback(
    () => swipeableRef.current?.openRight?.(),
    []
  );

  const handlePressStart = useCallback(() => onTouch(address), [
    address,
    onTouch,
  ]);

  const renderRightActions = useCallback(
    progress => (
      <Row width={120}>
        <RightAction
          onPress={handleEditContact}
          progress={progress}
          text="Edit"
          x={120}
        />
        <RightAction
          onPress={handleDeleteContact}
          progress={progress}
          text="Delete"
          x={90}
        />
      </Row>
    ),
    [handleDeleteContact, handleEditContact]
  );

  return (
    <Swipeable
      friction={2}
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={0}
    >
      <ContactRow
        accountType={accountType}
        address={address}
        color={color}
        nickname={nickname}
        onLongPress={handleLongPress}
        onPress={onPress}
        onPressStart={handlePressStart}
      />
    </Swipeable>
  );
};

export default React.forwardRef(SwipeableContactRow);
