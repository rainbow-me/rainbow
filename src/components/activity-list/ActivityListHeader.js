import { compose, onlyUpdateForKeys, pickProps, withProps } from 'recompact';
import { ListHeader } from '../list';
import { Text } from '../text';

const titleRenderer = withProps({
  size: 'larger',
  weight: 'bold',
})(Text);

export default compose(
  pickProps(Object.keys(ListHeader.propTypes)),
  withProps({
    isSticky: true,
    shouldRasterizeIOS: true,
    showDivider: false,
    titleRenderer,
  }),
  onlyUpdateForKeys(['title'])
)(ListHeader);
