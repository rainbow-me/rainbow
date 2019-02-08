import {
  compose,
  defaultProps,
  setDisplayName,
  withProps,
} from 'recompact';
import LayoutWithMargins from './LayoutWithMargins';

export default compose(
  setDisplayName('RowWithMargins'),
  defaultProps({ margin: 19 }),
  withProps({
    direction: 'row',
    marginKey: 'marginRight',
  }),
)(LayoutWithMargins);
