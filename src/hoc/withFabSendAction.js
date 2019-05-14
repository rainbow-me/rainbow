import {
  compose, lifecycle, omitProps, pure, withProps,
} from 'recompact';

export default compose(
  withProps(({ selectedId, uniqueId }) => ({ fabDropped: selectedId === -3, highlight: selectedId === uniqueId })),
  omitProps('selectedId'),
  lifecycle({
    componentDidUpdate(prevProps) {
      if (prevProps.highlight && !this.props.highlight && this.props.fabDropped) {
        this.props.onPress();
      }
    },
  }),
  pure,
);
