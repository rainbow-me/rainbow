import { compose, onlyUpdateForKeys, pickProps } from 'recompact';
import { ListHeader } from '../list';

export default compose(
  pickProps(Object.keys(ListHeader.propTypes)),
  onlyUpdateForKeys(['title']),
)(ListHeader);
