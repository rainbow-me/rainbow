import PropTypes from 'prop-types';
import React from 'react';
// import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import { InteractionManager } from 'react-native';
import { compose, onlyUpdateForKeys, withHandlers } from 'recompact';
import { withFabSelection, withTransitionProps } from '../../hoc';
import { colors } from '../../styles';
import { Icon } from '../icons';
import { Centered } from '../layout';
// import DeleteButton from './DeleteButton';
import FloatingActionButton from './FloatingActionButton';
// import MovableFabWrapper from './MovableFabWrapper';

let onPressMutex = false;
/**
 * This function is a bit hacky workaround for an issue of blinking
 * keyboard while navigating from wallet screen to send sheet immediately
 * after closing asset screen. Firstly, I guarantee that there're no
 * collapsing events by mutex, then I set additional timeout with flexible
 * time set in order to make sure that there's always enough time
 * to close the keyboard after transition.
 */
function performSafely(operation, transitionProps) {
  if (onPressMutex) {
    return;
  }
  onPressMutex = true;
  InteractionManager.runAfterInteractions(() => {
    const current = Date.now();
    setTimeout(() => {
      operation();
      onPressMutex = false;
    }, Math.max(1000 - current + transitionProps.date + transitionProps.isTransitioning ? 400 : 0, 0));
  });
}

const FloatingActionButtonWithDisabled = withFabSelection(FloatingActionButton);

const SendFab = ({
  //areas,
  //deleteButtonScale,
  disabled,
  onPress,
  scaleTo,
  //scrollViewTracker,
  //sections,
  tapRef,
  //...props
}) => (
  <Centered flex={0}>
    {/*
      <DeleteButton deleteButtonScale={deleteButtonScale} />
      <MovableFabWrapper
        actionType="send"
        deleteButtonScale={deleteButtonScale}
        scrollViewTracker={scrollViewTracker}
        sections={sections}
        tapRef={tapRef}
      >
    */}
    <FloatingActionButtonWithDisabled
      backgroundColor={colors.paleBlue}
      disabled={disabled}
      onPress={onPress}
      scaleTo={scaleTo}
      tapRef={tapRef}
    >
      <Icon height={22} marginBottom={4} name="send" width={23} />
    </FloatingActionButtonWithDisabled>
    {/*
      </MovableFabWrapper>
    */}
  </Centered>
);

SendFab.propTypes = {
  //areas: PropTypes.array,
  //children: PropTypes.any,
  //deleteButtonScale: PropTypes.object,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  scaleTo: PropTypes.number,
  //scrollViewTracker: PropTypes.object,
  //sections: PropTypes.array,
  tapRef: PropTypes.object,
};

SendFab.defaultProps = {
  // scaleTo: FloatingActionButton.sizeWhileDragging / FloatingActionButton.size
};

export default compose(
  withNavigation,
  withTransitionProps,
  withHandlers({
    onPress: ({ navigation, transitionProps }) => () => {
      performSafely(() => navigation.navigate('SendSheet'), transitionProps);
    },
  }),
  onlyUpdateForKeys(['disabled', 'sections'])
  // withProps({
  //   deleteButtonScale: new Animated.Value(DeleteButton.defaultScale),
  //   tapRef: React.createRef(),
  // }),
)(SendFab);
