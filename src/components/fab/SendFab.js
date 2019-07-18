import PropTypes from 'prop-types';
import React from 'react';
import Animated from 'react-native-reanimated';
import { withNavigation } from 'react-navigation';
import {
  compose,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { withFabSelection } from '../../hoc';
import { Icon } from '../icons';
import { Centered } from '../layout';
import DeleteButton from './DeleteButton';
import FloatingActionButton from './FloatingActionButton';
import MovableFabWrapper from './MovableFabWrapper';

const FloatingActionButtonWithDisabled = withFabSelection(FloatingActionButton);

const SendFab = ({
  areas,
  deleteButtonScale,
  disabled,
  onPress,
  scrollViewTracker,
  sections,
  tapRef,
  ...props
}) => (
  <Centered flex={0}>
    <DeleteButton deleteButtonScale={deleteButtonScale} />
    <MovableFabWrapper
      actionType="send"
      deleteButtonScale={deleteButtonScale}
      opacity={0.15}
      scrollViewTracker={scrollViewTracker}
      sections={sections}
      tapRef={tapRef}
    >
      <FloatingActionButtonWithDisabled
        disabled={disabled}
        onPress={onPress}
        scaleTo={FloatingActionButton.sizeWhileDragging / FloatingActionButton.size}
        tapRef={tapRef}
      >
        <Icon
          height={22}
          marginBottom={4}
          name="send"
          width={23}
        />
      </FloatingActionButtonWithDisabled>
    </MovableFabWrapper>
  </Centered>
);

SendFab.propTypes = {
  areas: PropTypes.array,
  children: PropTypes.any,
  deleteButtonScale: PropTypes.object,
  disabled: PropTypes.bool,
  onPress: PropTypes.func,
  scrollViewTracker: PropTypes.object,
  sections: PropTypes.array,
  tapRef: PropTypes.object,
};

export default compose(
  withNavigation,
  withHandlers({ onPress: ({ navigation }) => () => navigation.navigate('SendSheet') }),
  onlyUpdateForKeys(['disabled', 'sections']),
  withProps({
    deleteButtonScale: new Animated.Value(DeleteButton.defaultScale),
    tapRef: React.createRef(),
  }),
)(SendFab);
