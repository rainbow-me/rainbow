import { compose, onlyUpdateForKeys, pickProps, withProps } from 'recompact';
import { ListHeader } from '../list';
import { Text } from '../text';

export default compose(
  pickProps(Object.keys(ListHeader.propTypes)),
  withProps({
    shouldRasterizeIOS: true,
    showDivider: false,
    titleRenderer: withProps({ size: 'large', weight: 'bold' })(Text),
  }),
  onlyUpdateForKeys(['title']),
)(ListHeader);
