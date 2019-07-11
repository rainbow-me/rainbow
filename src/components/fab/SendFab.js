import PropTypes from 'prop-types';
import React from 'react';
import { withNavigation } from 'react-navigation';
import { connect } from 'react-redux';
import {
  compose,
  omitProps,
  onlyUpdateForKeys,
  withHandlers,
  withProps,
} from 'recompact';
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
  <EnhancedMovable
    actionType="send"
    deleteButtonTranslate={deleteButtonTranslate}
    tapRef={tapRef}
    scrollViewTracker={scrollViewTracker}
    sections={sections}
  >
    <FloatingActionButtonWithDisabled
      disabled={disabled}
      onPress={onPress}
      tapRef={tapRef}
      scaleTo={1.1}
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
