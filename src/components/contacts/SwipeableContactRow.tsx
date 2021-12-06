import React, { useCallback, useImperativeHandle, useRef } from 'react';
import { Animated } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import DeleteIcon from '../../assets/swipeToDelete.png';
import EditIcon from '../../assets/swipeToEdit.png';
import { ButtonPressAnimation } from '../animations';
import { Centered, Row } from '../layout';
import { Text } from '../text';
// @ts-expect-error ts-migrate(6142) FIXME: Module './ContactRow' was resolved to '/Users/nick... Remove this comment to see the full error message
import ContactRow from './ContactRow';
import showDeleteContactActionSheet from './showDeleteContactActionSheet';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/styles' or its cor... Remove this comment to see the full error message
import { margin, position } from '@rainbow-me/styles';

const AnimatedCentered = Animated.createAnimatedComponent(Centered);

const RightAction = ({ onPress, progress, text, x }: any) => {
  const isEdit = text === 'Edit';
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [x, 0],
  });

  // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'useTheme'.
  const { colors } = useTheme();

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <AnimatedCentered
      flex={1}
      marginRight={isEdit ? 0 : 10}
      style={{ transform: [{ translateX }] }}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <ImgixImage
          // @ts-expect-error ts-migrate(2304) FIXME: Cannot find name 'android'.
          css={margin(0, 10, android ? 0 : 3, 10)}
          source={isEdit ? EditIcon : DeleteIcon}
          style={position.sizeAsObject(35)}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
  }: any,
  forwardedRef: any
) => {
  const swipeableRef = useRef();

  useImperativeHandle(forwardedRef, () => ({
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'close' does not exist on type 'never'.
    close: swipeableRef.current?.close,
  }));

  const handleDeleteContact = useCallback(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'close' does not exist on type 'never'.
    swipeableRef.current?.close?.();
    showDeleteContactActionSheet({
      address,
      nickname,
      removeContact,
    });
  }, [address, nickname, removeContact]);

  const handleEditContact = useCallback(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'close' does not exist on type 'never'.
    swipeableRef.current?.close?.();
    onSelectEdit({ address, color, nickname });
  }, [address, color, nickname, onSelectEdit]);

  const handleLongPress = useCallback(
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'openRight' does not exist on type 'never... Remove this comment to see the full error message
    () => swipeableRef.current?.openRight?.(),
    []
  );

  const handlePressStart = useCallback(() => onTouch(address), [
    address,
    onTouch,
  ]);

  const renderRightActions = useCallback(
    progress => (
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
      <Row width={120}>
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
        <RightAction
          onPress={handleEditContact}
          progress={progress}
          text="Edit"
          x={120}
        />
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
        '--jsx' flag is provided... Remove this comment to see the full error
        message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Swipeable
      friction={2}
      // @ts-expect-error ts-migrate(2322) FIXME: Type 'MutableRefObject<undefined>' is not assignab... Remove this comment to see the full error message
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      rightThreshold={0}
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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
