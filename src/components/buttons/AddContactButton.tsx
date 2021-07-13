import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
import { View } from 'react-primitives';
import AddContactIcon from '../../assets/addContactIcon.png';
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import Button from './Button';
import { ImgixImage } from '@rainbow-me/images';
import { neverRerender } from '@rainbow-me/utils';

const duration = 200;
const transition = (
  <Transition.Sequence>
    <Transition.Together>
      <Transition.Out
        durationMs={duration * 0.666}
        interpolation="easeIn"
        type="fade"
      />
      <Transition.Out
        durationMs={duration * 0.42}
        interpolation="easeIn"
        type="slide-right"
      />
    </Transition.Together>
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    <Transition.Together>
      <Transition.In
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      <Transition.In
        durationMs={duration * 0.5}
        interpolation="easeOut"
        type="slide-right"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const AddButton = neverRerender(({ onPress }) => {
  const { colors } = useTheme();
  return (
    <Button
      backgroundColor={colors.appleBlue}
      onPress={onPress}
      size="small"
      testID="add-contact-button"
      type="pill"
    >
      <ImgixImage
        source={AddContactIcon}
        style={{
          height: 14.7,
          margin: 1.525,
          width: 19,
        }}
      />
    </Button>
  );
});

const EditButton = neverRerender(({ onPress }) => (
  <ButtonPressAnimation
    activeOpacity={0.2}
    onPress={onPress}
    style={{
      height: 30,
      justifyContent: 'center',
      paddingRight: 4,
    }}
    testID="edit-contact-button"
  >
    <Icon name="threeDots" />
  </ButtonPressAnimation>
));

const AddContactButton = ({ edit, onPress }) => {
  const addButtonRef = useRef();
  const editButtonRef = useRef();

  useEffect(() => {
    addButtonRef.current?.animateNextTransition();
    editButtonRef.current?.animateNextTransition();
  }, [edit]);

  return (
    <View>
      {edit ? (
        <Transitioning.View ref={editButtonRef} transition={transition}>
          <EditButton onPress={onPress} />
        </Transitioning.View>
      ) : (
        <Transitioning.View ref={addButtonRef} transition={transition}>
          <AddButton onPress={onPress} />
        </Transitioning.View>
      )}
    </View>
  );
};

export default React.memo(AddContactButton);
