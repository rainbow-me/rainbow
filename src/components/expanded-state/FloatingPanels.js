import { compose, setDisplayName, withProps } from 'recompact';
import { position } from '../../styles';
import { ColumnWithMargins } from '../layout';

const FloatingPanelsMargin = 20;

const FloatingPanels = compose(
  setDisplayName('FloatingPanels'),
  withProps({
    justify: 'center',
    margin: FloatingPanelsMargin,
    pointerEvents: 'box-none',
    style: position.sizeAsObject('100%'),
  }),
)(ColumnWithMargins);

FloatingPanels.margin = FloatingPanelsMargin;

export default FloatingPanels;
