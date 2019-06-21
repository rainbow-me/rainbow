import {
  compose, lifecycle, omitProps, pure, withProps,
} from 'recompact';
import connect from 'react-redux/es/connect/connect';
import { setOpenFamilyTabs } from '../redux/openFamilyTabs';

const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
    actionType,
  }
}) => ({
  actionType,
  selectedId,
});

let openFamilyCheck = 0;
let currentFamilyId = undefined;

export default compose(
  connect(mapStateToProps, { setOpenFamilyTabs }),
  withProps(({ selectedId, uniqueId }) => ({ fabDropped: selectedId === -3, highlight: selectedId === uniqueId, family: String(selectedId).search(`family`) > -1 ? selectedId : false })),
  omitProps('selectedId'),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (this.props.family && !this.props.fabDropped) {
        if( currentFamilyId != this.props.family) {
          openFamilyCheck = 0;
        }
        if (++openFamilyCheck == 1) {
          currentFamilyId = this.props.family;
          setTimeout(() => {
            if (this.props.family) {
              this.props.setOpenFamilyTabs({ index: Number(this.props.family.replace('family_', '')), state: true });
            }
          }, 500);
        }
      } else {
        openFamilyCheck = 0;
      }
      if (prevProps.highlight && !this.props.highlight && this.props.fabDropped) {
        if (this.props.actionType === 'send') {
          this.props.onPress();
        }
      }
    },
  }),
  pure,
);
