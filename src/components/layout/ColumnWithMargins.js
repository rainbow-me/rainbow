import {
  compose,
  defaultProps,
  setDisplayName,
  withProps,
} from 'recompact';
import LayoutWithMargins from './LayoutWithMargins';

export default compose(
  setDisplayName('ColumnWithMargins'),
  defaultProps({ margin: 20 }),
  withProps({
    direction: 'column',
    marginKey: 'marginBottom',
  }),
)(LayoutWithMargins);
