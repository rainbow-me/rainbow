import { compose, setDisplayName, withProps } from 'recompact';
import LayoutWithDividers from './LayoutWithDividers';

export default compose(
  setDisplayName('RowWithDividers'),
  withProps(({ dividerProps }) => ({
    direction: 'row',
    dividerProps: {
      horizontal: false,
      ...dividerProps,
    },
  })),
)(LayoutWithDividers);
