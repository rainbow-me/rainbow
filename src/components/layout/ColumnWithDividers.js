import { compose, setDisplayName, withProps } from 'recompact';
import LayoutWithDividers from './LayoutWithDividers';

export default compose(
  setDisplayName('ColumnWithDividers'),
  withProps(({ dividerProps }) => ({
    direction: 'column',
    dividerProps: {
      horizontal: true,
      ...dividerProps,
    },
  })),
)(LayoutWithDividers);
