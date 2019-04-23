import {
  compose,
  defaultProps,
  setDisplayName,
  withProps,
} from 'recompact';
import LayoutWithMargins from './LayoutWithMargins';

export default compose(
  setDisplayName('RowWithMargins'),
  defaultProps({
    margin: 19,
    marginKey: 'marginRight',
  }),
  withProps({ direction: 'row' }),
)(LayoutWithMargins);
