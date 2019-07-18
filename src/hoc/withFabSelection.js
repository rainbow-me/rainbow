import { connect } from 'react-redux';
import { compose, withProps } from 'recompact';
import { createSelector } from 'reselect';
import { extraStates } from '../components/fab/MovableFabWrapper';
import {
  setActionType,
  setScrollingVelocity,
  updateSelectedID,
} from '../redux/selectedWithFab';

const mapStateToProps = ({ selectedWithFab: { selectedId } }) => ({ selectedId });

const fabSelectedIdSelector = state => state.selectedId;

const withFabSelectionValidation = selectedId => ({
  isFabSelectionValid: selectedId !== extraStates.notSendable,
});

const withFabSelectionValidationSelector = createSelector(
  [fabSelectedIdSelector],
  withFabSelectionValidation,
);

export default Component => compose(
  connect(mapStateToProps, {
    setActionType,
    setScrollingVelocity,
    updateSelectedID,
  }),
  withProps(withFabSelectionValidationSelector),
)(Component);
