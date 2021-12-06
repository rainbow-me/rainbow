import React, { useEffect, useRef } from 'react';
import { Transition, Transitioning } from 'react-native-reanimated';
// @ts-expect-error ts-migrate(7016) FIXME: Could not find a declaration file for module 'reac... Remove this comment to see the full error message
import { View } from 'react-primitives';
import AddContactIcon from '../../assets/addContactIcon.png';
// @ts-expect-error ts-migrate(6142) FIXME: Module '../../context/ThemeContext' was resolved t... Remove this comment to see the full error message
import { useTheme } from '../../context/ThemeContext';
import { ButtonPressAnimation } from '../animations';
import { Icon } from '../icons';
import Button from './Button';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/images' or its cor... Remove this comment to see the full error message
import { ImgixImage } from '@rainbow-me/images';
// @ts-expect-error ts-migrate(2307) FIXME: Cannot find module '@rainbow-me/utils' or its corr... Remove this comment to see the full error message
import { neverRerender } from '@rainbow-me/utils';

const duration = 200;
const transition = (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
  <Transition.Sequence>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.Out
        durationMs={duration * 0.666}
        interpolation="easeIn"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.Out
        durationMs={duration * 0.42}
        interpolation="easeIn"
        type="slide-right"
      />
    </Transition.Together>
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Change durationMs={duration} interpolation="easeInOut" />
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Transition.Together>
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        durationMs={duration}
        interpolation="easeOut"
        type="fade"
      />
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
      <Transition.In
        durationMs={duration * 0.5}
        interpolation="easeOut"
        type="slide-right"
      />
    </Transition.Together>
  </Transition.Sequence>
);

const AddButton = neverRerender(({ onPress }: any) => {
  const { colors } = useTheme();
  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <Button
      backgroundColor={colors.appleBlue}
      onPress={onPress}
      size="small"
      testID="add-contact-button"
      type="pill"
    >
      // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
      '--jsx' flag is provided... Remove this comment to see the full error
      message
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

const EditButton = neverRerender(({ onPress }: any) => (
  // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
    '--jsx' flag is provided... Remove this comment to see the full error
    message
    <Icon name="threeDots" />
  </ButtonPressAnimation>
));

const AddContactButton = ({ edit, onPress }: any) => {
  const addButtonRef = useRef();
  const editButtonRef = useRef();

  useEffect(() => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
    addButtonRef.current?.animateNextTransition();
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'animateNextTransition' does not exist on... Remove this comment to see the full error message
    editButtonRef.current?.animateNextTransition();
  }, [edit]);

  return (
    // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
    <View>
      {edit ? (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Transitioning.View ref={editButtonRef} transition={transition}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <EditButton onPress={onPress} />
        </Transitioning.View>
      ) : (
        // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the '--jsx' flag is provided... Remove this comment to see the full error message
        <Transitioning.View ref={addButtonRef} transition={transition}>
          // @ts-expect-error ts-migrate(17004) FIXME: Cannot use JSX unless the
          '--jsx' flag is provided... Remove this comment to see the full error
          message
          <AddButton onPress={onPress} />
        </Transitioning.View>
      )}
    </View>
  );
};

export default React.memo(AddContactButton);
