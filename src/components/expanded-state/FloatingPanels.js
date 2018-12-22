import { compose, setDisplayName, withProps } from 'recompact';
import { ColumnWithMargins } from '../layout';

export default compose(
  setDisplayName('FloatingPanels'),
  withProps({
    margin: 20,
    style: { width: '100%' },
  }),
)(ColumnWithMargins);
