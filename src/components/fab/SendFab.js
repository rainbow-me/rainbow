import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import {
  compose,
  omitProps,
  onlyUpdateForKeys,
  pure,
  withHandlers,
  withProps,
} from 'recompact';
import connect from 'react-redux/es/connect/connect';
import Icon from '../icons/Icon';
import FloatingActionButton from './FloatingActionButton';
import EnhancedMovable, { extraStates } from './MovableFabWrapper';


const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
  },
}) => ({
  selectedId,
});

const FloatingActionButtonWithDisabled = compose(
  connect(mapStateToProps),
  withProps(({ selectedId }) => ({ greyed: selectedId === extraStates.notSendable, size: FloatingActionButton.size })),
  omitProps('selectedId'),
)(FloatingActionButton);

const SendFab = ({
  disabled, onPress, deleteButtonTranslate, scrollViewTracker, areas, tapRef, sections, ...props
}) => (
  <EnhancedMovable
    actionType="send"
    tapRef={tapRef}
    scrollViewTracker={scrollViewTracker}
    sections={sections}
    deleteButtonTranslate={deleteButtonTranslate}
  >
    <FloatingActionButtonWithDisabled
      tapRef={tapRef}
      scaleTo={1.1}
      disabled={disabled}
      onPress={onPress}
    >
      <Icon
        name="send"
        style={{
          height: 21,
          marginBottom: 2,
          width: 22,
        }}
      />
    </FloatingActionButtonWithDisabled>
  </EnhancedMovable>
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
  pure,
  withNavigation,
  withHandlers({
    onPress: ({ navigation }) => () => {
      navigation.navigate('SendSheet');
    },
  }),
  onlyUpdateForKeys(['disabled', 'sections']),
  withProps({
    tapRef: React.createRef(),
  }),
)(SendFab);
