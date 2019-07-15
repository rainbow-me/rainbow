import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import {
  compose,
  omitProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
import { withFabSelection } from '../../hoc';
import { Icon } from '../icons';
import FloatingActionButton from './FloatingActionButton';
import MovableFabWrapper, { extraStates } from './MovableFabWrapper';

const FloatingActionButtonWithDisabled = compose(
  withFabSelection,
  withProps(({ selectedId }) => ({
    greyed: selectedId === extraStates.notSendable,
    size: FloatingActionButton.size,
  })),
  omitProps('selectedId'),
)(FloatingActionButton);

const SendFab = ({
  areas,
  deleteButtonTranslate,
  disabled,
  onPress,
  scrollViewTracker,
  sections,
  tapRef,
  ...props
}) => (
  <MovableFabWrapper
    actionType="send"
    deleteButtonTranslate={deleteButtonTranslate}
    scrollViewTracker={scrollViewTracker}
    sections={sections}
    tapRef={tapRef}
  >
    <FloatingActionButtonWithDisabled
      disabled={disabled}
      onPress={onPress}
      scaleTo={1.1}
      tapRef={tapRef}
    >
      <Icon
        name="send"
        style={{
          height: 22,
          marginBottom: 4,
          width: 23,
        }}
      />
    </FloatingActionButtonWithDisabled>
  </MovableFabWrapper>
);

SendFab.propTypes = {
  areas: PropTypes.array,
  children: PropTypes.any,
  deleteButtonTranslate: PropTypes.object,
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
  withProps({ tapRef: React.createRef() }),
)(SendFab);
