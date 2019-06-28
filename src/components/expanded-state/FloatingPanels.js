import { compose, setDisplayName, withProps } from 'recompact';
import { ColumnWithMargins } from '../layout';

const FloatingPanelsMargin = 20;

const FloatingPanels = compose(
  setDisplayName('FloatingPanels'),
  withProps((props) => {
    return {
      margin: FloatingPanelsMargin,
      style: { width: `${props.width}%` },
    }
  }),
)(ColumnWithMargins);

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
