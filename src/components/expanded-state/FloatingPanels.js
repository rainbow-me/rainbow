import { compose, setDisplayName, withProps } from 'recompact';
import { ColumnWithMargins } from '../layout';

const FloatingPanelsMargin = 20;

const FloatingPanels = compose(
  setDisplayName('FloatingPanels'),
  withProps({
    margin: FloatingPanelsMargin,
    style: { width: '100%' },
  }),
)(ColumnWithMargins);

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
