import { connect } from 'react-redux';
import {
  compose,
  lifecycle,
  omitProps,
  pure,
  withProps,
} from 'recompact';
import { setOpenFamilyTabs } from '../redux/openFamilyTabs';

const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
    actionType,
  },
}) => ({
  actionType,
  selectedId,
});

let openFamilyCheck = 0;
let currentFamilyId;
let timer;

export default compose(
  connect(mapStateToProps, { setOpenFamilyTabs }),
  withProps(({ selectedId, uniqueId, familyName }) => ({
    fabDropped: selectedId === -3,
    family: selectedId === familyName,
    highlight: selectedId === uniqueId || selectedId === familyName,
  })),
  omitProps('selectedId'),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (this.props.family && !this.props.fabDropped) {
        if (currentFamilyId !== this.props.family) {
          openFamilyCheck = 0;
          clearTimeout(timer);
        }
        if (++openFamilyCheck === 1) {
          timer = setTimeout(() => {
            if (this.props.family) {
              this.props.setOpenFamilyTabs({ index: this.props.familyId, state: true });
            }
          }, 300);
        }
      } else {
        openFamilyCheck = 0;
      }
      if (prevProps.highlight && !this.props.highlight && this.props.fabDropped) {
        if (this.props.actionType === 'send') {
          this.props.onPressSend();
        }
      }
    },
  }),
  pure,
);
