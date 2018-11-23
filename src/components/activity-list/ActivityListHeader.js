import { compose, onlyUpdateForKeys, pickProps, withProps } from 'recompact';
import { ListHeader } from '../list';

export default compose(
  pickProps(Object.keys(ListHeader.propTypes)),
  withProps({ shouldRasterizeIOS: true }),
  onlyUpdateForKeys(['title']),
)(ListHeader);
