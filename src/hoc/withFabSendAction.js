import { connect } from 'react-redux';
import {
  compose,
  lifecycle,
  omitProps,
  pure,
  withProps,
} from 'recompact';
import { createSelector } from 'reselect';
import withFabSelection from './withFabSelection';
import withOpenFamilyTabs from './withOpenFamilyTabs';
import { extraStates } from '../components/fab/MovableFabWrapper';

const mapStateToProps = ({ selectedWithFab: { actionType } }) => ({ actionType });

const familyNameSelector = state => state.familyName;
const selectedIdSelector = state => state.selectedId;
const uniqueIdSelector = state => state.uniqueId;

const derivePropsFromSelectedId = (familyName, selectedId, uniqueId) => ({
  fabDropped: selectedId === extraStates.gestureInactive,
  family: selectedId === familyName,
  highlight: (selectedId === uniqueId) || (selectedId === familyName),
});

const withPropsDerivedFromSelectedId = createSelector(
  [
    familyNameSelector,
    selectedIdSelector,
    uniqueIdSelector,
  ],
  derivePropsFromSelectedId,
);

let openFamilyCheck = 0;
let currentFamilyId;
let timer;

export default compose(
  connect(mapStateToProps),
  withFabSelection,
  withOpenFamilyTabs,
  withProps(withPropsDerivedFromSelectedId),
  omitProps('selectedId'),
  lifecycle({
    componentDidUpdate(prevProps) {
      const {
        actionType,
        fabDropped,
        family,
        familyId,
        highlight,
        onPressSend,
        setOpenFamilyTabs,
      } = this.props;

      if (family && !fabDropped) {
        if (currentFamilyId !== family) {
          openFamilyCheck = 0;
          clearTimeout(timer);
        }

        if (++openFamilyCheck === 1) {
          timer = setTimeout(() => {
            if (family) {
              setOpenFamilyTabs({ index: familyId, state: true });
            }
          }, 300);
        }
      } else {
        openFamilyCheck = 0;
      }

      const wasHighlighted = highlight || prevProps.highlight;
      if (fabDropped && wasHighlighted) {
        if (actionType === 'send' && onPressSend) {
          onPressSend();
        }
      }
    },
  }),
  pure,
);
