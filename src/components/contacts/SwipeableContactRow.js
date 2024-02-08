import lang from 'i18n-js';
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
import { ImgixImage } from '@/components/images';
import { margin, position } from '@/styles';

const AnimatedCentered = Animated.createAnimatedComponent(Centered);

const styles = [margin.object(0, 10, android ? 0 : 3, 10), position.sizeAsObject(35)];

const RightAction = ({ onPress, progress, text, type, x }) => {
  const isEdit = type === 'edit';
  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [x, 0],
  });

  const { colors } = useTheme();

  return (
    <AnimatedCentered flex={1} marginRight={isEdit ? 0 : 10} style={{ transform: [{ translateX }] }}>
      <ButtonPressAnimation onPress={onPress} scaleTo={0.9}>
        <ImgixImage source={isEdit ? EditIcon : DeleteIcon} style={styles} size={30} />
        <Text
          align="center"
          color={colors.alpha(colors.blueGreyDark, 0.4)}
          letterSpacing="roundedTight"
          size="smaller"
          weight="semibold"
          numberOfLines={1}
        >
          {text}
        </Text>
      </ButtonPressAnimation>
    </AnimatedCentered>
  );
};

const SwipeableContactRow = (
  { accountType, address, color, ens, image, network, nickname, onPress, onSelectEdit, onTouch, removeContact },
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
    onSelectEdit({ address, color, ens, nickname });
  }, [address, color, ens, nickname, onSelectEdit]);

  const handleLongPress = useCallback(() => swipeableRef.current?.openRight?.(), []);

  const handlePressStart = useCallback(() => onTouch(address), [address, onTouch]);

  const renderRightActions = useCallback(
    progress => (
      <Row width={120}>
        <RightAction onPress={handleEditContact} progress={progress} type="edit" text={lang.t('button.edit')} x={120} />
        <RightAction onPress={handleDeleteContact} progress={progress} type="text" text={lang.t('button.delete')} x={90} />
      </Row>
    ),
    [handleDeleteContact, handleEditContact]
  );

  return (
    <Swipeable friction={2} ref={swipeableRef} renderRightActions={renderRightActions} rightThreshold={0}>
      <ContactRow
        accountType={accountType}
        address={address}
        color={color}
        ens={ens}
        image={image}
        network={network}
        nickname={nickname}
        onLongPress={handleLongPress}
        onPress={onPress}
        onPressStart={handlePressStart}
      />
    </Swipeable>
  );
};

export default React.forwardRef(SwipeableContactRow);
