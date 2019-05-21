import {
  compose, lifecycle, omitProps, pure, withProps,
} from 'recompact';
import connect from 'react-redux/es/connect/connect';

const mapStateToProps = ({
  selectedWithFab: {
    selectedId,
    actionType,
  },
}) => ({
  actionType,
  selectedId,
});

export default compose(
  connect(mapStateToProps),
  withProps(({ selectedId, uniqueId }) => ({ fabDropped: selectedId === -3, highlight: selectedId === uniqueId })),
  omitProps('selectedId'),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (prevProps.highlight && !this.props.highlight && this.props.fabDropped) {
        if (this.props.actionType === 'send') {
          this.props.onPress();
        }
      }
    },
  }),
  pure,
);
